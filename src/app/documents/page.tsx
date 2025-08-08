'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentApi, projectApi } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  PlusIcon, 
  FileIcon, 
  FolderIcon,
  DownloadIcon,
  EyeIcon,
  MoreVerticalIcon,
  EditIcon,
  TrashIcon,
  UploadIcon,
  SearchIcon
} from 'lucide-react';
import { formatDate, formatFileSize } from '@/lib/utils';
import type { Document, Project } from '@/types';

export default function DocumentsPage() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [fileType, setFileType] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: documents, isLoading, error } = useQuery({
    queryKey: ['documents', selectedProject, searchTerm, fileType],
    queryFn: () => documentApi.getDocuments({
      project_id: selectedProject || undefined,
      search: searchTerm || undefined,
      type: fileType || undefined,
    }),
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectApi.getProjects(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => documentApi.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const filteredDocuments = documents?.data?.data || [];

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📋';
    if (mimeType.includes('video')) return '🎥';
    if (mimeType.includes('audio')) return '🎵';
    return '📁';
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <p className="text-red-600">Terjadi kesalahan saat memuat dokumen</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dokumen</h1>
            <p className="text-gray-600">Kelola file dan dokumen proyek</p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <UploadIcon className="h-5 w-5 mr-2" />
            Upload Dokumen
          </button>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Cari dokumen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={selectedProject || ''}
                onChange={(e) => setSelectedProject(e.target.value ? parseInt(e.target.value) : null)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Proyek</option>
                {projects?.data?.data?.map((project: Project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Tipe</option>
                <option value="image">Gambar</option>
                <option value="document">Dokumen</option>
                <option value="spreadsheet">Spreadsheet</option>
                <option value="presentation">Presentasi</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="other">Lainnya</option>
              </select>
            </div>
          </div>

          <div className="p-6">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-8">
                <FileIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Belum ada dokumen yang diupload</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDocuments.map((document: any) => (
                  <div key={document.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-2xl">
                        {getFileIcon(document.mime_type)}
                      </div>
                      <div className="relative">
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVerticalIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-medium text-gray-900 mb-2 truncate" title={document.name}>
                      {document.name}
                    </h3>

                    {document.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {document.description}
                      </p>
                    )}

                    <div className="space-y-2 text-xs text-gray-500 mb-4">
                      <div>Ukuran: {formatFileSize(document.file_size)}</div>
                      <div>Diupload: {formatDate(document.created_at)}</div>
                      {document.uploader && (
                        <div>Oleh: {document.uploader.name}</div>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        document.is_public 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {document.is_public ? 'Publik' : 'Privat'}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.open(`/api/documents/${document.id}/preview`, '_blank')}
                          className="text-blue-600 hover:text-blue-800"
                          title="Preview"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => window.open(`/api/documents/${document.id}/download`, '_blank')}
                          className="text-green-600 hover:text-green-800"
                          title="Download"
                        >
                          <DownloadIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Apakah Anda yakin ingin menghapus dokumen ini?')) {
                              deleteMutation.mutate(document.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-800"
                          title="Hapus"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showUploadModal && (
        <UploadModal
          projects={projects?.data?.data || []}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            setShowUploadModal(false);
          }}
        />
      )}
    </MainLayout>
  );
}

function UploadModal({ 
  projects, 
  onClose, 
  onSuccess 
}: { 
  projects: Project[];
  onClose: () => void; 
  onSuccess: () => void; 
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_id: '',
    is_public: false,
    type: 'document',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.name) {
        setFormData(prev => ({ ...prev, name: file.name }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);
      uploadFormData.append('name', formData.name);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('type', formData.type);
      uploadFormData.append('is_public', formData.is_public.toString());
      
      if (formData.project_id) {
        uploadFormData.append('documentable_type', 'App\\Models\\Project');
        uploadFormData.append('documentable_id', formData.project_id);
      }

      await documentApi.uploadDocument(uploadFormData);
      onSuccess();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Upload Dokumen</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Dokumen
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proyek (Opsional)
            </label>
            <select
              name="project_id"
              value={formData.project_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Proyek</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipe Dokumen
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="document">Dokumen</option>
              <option value="image">Gambar</option>
              <option value="spreadsheet">Spreadsheet</option>
              <option value="presentation">Presentasi</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="other">Lainnya</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_public"
              checked={formData.is_public}
              onChange={handleChange}
              className="mr-2"
            />
            <label className="text-sm text-gray-700">
              Dokumen publik (dapat diakses semua anggota)
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? 'Mengupload...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
