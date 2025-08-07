'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchApi } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  SearchIcon, 
  FilterIcon,
  FolderIcon,
  CheckSquareIcon,
  UsersIcon,
  FileTextIcon,
  MessageSquareIcon,
  CalendarIcon,
  ClockIcon
} from 'lucide-react';
import { formatRelativeTime, getStatusColor, getPriorityColor } from '@/lib/utils';
import type { SearchResults } from '@/types';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'relevance' | 'date'>('relevance');

  const searchTypes = [
    { value: 'projects', label: 'Proyek', icon: FolderIcon },
    { value: 'tasks', label: 'Tugas', icon: CheckSquareIcon },
    { value: 'users', label: 'Pengguna', icon: UsersIcon },
    { value: 'documents', label: 'Dokumen', icon: FileTextIcon },
    { value: 'comments', label: 'Komentar', icon: MessageSquareIcon },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ['search', debouncedQuery, selectedTypes, sortBy],
    queryFn: () => searchApi.globalSearch(debouncedQuery, selectedTypes.length > 0 ? selectedTypes : undefined),
    enabled: debouncedQuery.length >= 2,
  });

  const handleTypeToggle = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const getResultIcon = (type: string) => {
    const typeConfig = searchTypes.find(t => t.value === type);
    const IconComponent = typeConfig?.icon || FileTextIcon;
    return <IconComponent className="h-5 w-5" />;
  };

  const getResultTypeLabel = (type: string) => {
    const typeConfig = searchTypes.find(t => t.value === type);
    return typeConfig?.label || type;
  };

  const renderSearchResult = (result: any, type: string) => {
    switch (type) {
      case 'projects':
        return (
          <div className="p-4 hover:bg-gray-50 border-b border-gray-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getResultIcon(type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {result.name}
                  </h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(result.status)}`}>
                    {result.status}
                  </span>
                </div>
                <p className="text-gray-600 mt-1 line-clamp-2">{result.description}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    Deadline: {new Date(result.end_date).toLocaleDateString('id-ID')}
                  </span>
                  <span className="flex items-center">
                    <UsersIcon className="h-4 w-4 mr-1" />
                    {result.members_count || 0} anggota
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'tasks':
        return (
          <div className="p-4 hover:bg-gray-50 border-b border-gray-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getResultIcon(type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {result.title}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(result.priority)}`}>
                      {result.priority}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(result.status)}`}>
                      {result.status}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 mt-1 line-clamp-2">{result.description}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center">
                    <FolderIcon className="h-4 w-4 mr-1" />
                    {result.project?.name}
                  </span>
                  {result.due_date && (
                    <span className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {new Date(result.due_date).toLocaleDateString('id-ID')}
                    </span>
                  )}
                  {result.assigned_users?.length > 0 && (
                    <span className="flex items-center">
                      <UsersIcon className="h-4 w-4 mr-1" />
                      {result.assigned_users.length} ditugaskan
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="p-4 hover:bg-gray-50 border-b border-gray-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <UsersIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900">{result.name}</h3>
                <p className="text-gray-600">{result.email}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span>{result.role?.name}</span>
                  {result.department && <span>{result.department}</span>}
                </div>
              </div>
            </div>
          </div>
        );

      case 'documents':
        return (
          <div className="p-4 hover:bg-gray-50 border-b border-gray-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getResultIcon(type)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900 truncate">{result.name}</h3>
                <p className="text-gray-600 mt-1">{result.description}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span>{result.file_size}</span>
                  <span>{result.file_type}</span>
                  <span className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {formatRelativeTime(result.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'comments':
        return (
          <div className="p-4 hover:bg-gray-50 border-b border-gray-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getResultIcon(type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Komentar oleh {result.user?.name}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {formatRelativeTime(result.created_at)}
                  </span>
                </div>
                <p className="text-gray-600 mt-1 line-clamp-3">{result.content}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span>
                    {result.commentable_type === 'project' ? 'Proyek' : 'Tugas'}: {result.commentable?.name || result.commentable?.title}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 hover:bg-gray-50 border-b border-gray-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getResultIcon(type)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900">{result.title || result.name}</h3>
                <p className="text-gray-600 mt-1">{result.description || result.content}</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pencarian</h1>
          <p className="text-gray-600">Cari proyek, tugas, pengguna, dan konten lainnya</p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col space-y-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Cari apapun..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {searchTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleTypeToggle(type.value)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
                      selectedTypes.includes(type.value)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <type.icon className="h-4 w-4" />
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FilterIcon className="h-5 w-5 text-gray-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'relevance' | 'date')}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="relevance">Relevansi</option>
                    <option value="date">Tanggal</option>
                  </select>
                </div>

                {debouncedQuery && searchResults && (
                  <p className="text-sm text-gray-500">
                    {searchResults.data?.total || 0} hasil ditemukan
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="min-h-96">
            {!debouncedQuery ? (
              <div className="text-center py-12">
                <SearchIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Masukkan kata kunci untuk mulai mencari</p>
                <p className="text-sm text-gray-400 mt-2">Minimal 2 karakter</p>
              </div>
            ) : isLoading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600">Terjadi kesalahan saat mencari</p>
              </div>
            ) : !searchResults?.data || Object.keys(searchResults.data).length === 0 ? (
              <div className="text-center py-12">
                <SearchIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Tidak ada hasil ditemukan</p>
                <p className="text-sm text-gray-400 mt-2">Coba gunakan kata kunci yang berbeda</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {Object.entries(searchResults.data).map(([type, results]) => {
                  if (!Array.isArray(results) || results.length === 0) return null;
                  
                  return (
                    <div key={type}>
                      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900 flex items-center">
                          {getResultIcon(type)}
                          <span className="ml-2">{getResultTypeLabel(type)}</span>
                          <span className="ml-2 text-sm text-gray-500">({results.length})</span>
                        </h2>
                      </div>
                      <div>
                        {results.map((result: any, index: number) => (
                          <div key={`${type}-${result.id || index}`}>
                            {renderSearchResult(result, type)}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
