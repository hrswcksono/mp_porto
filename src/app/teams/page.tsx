'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi, userApi } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  PlusIcon, 
  UsersIcon, 
  UserIcon,
  MoreVerticalIcon,
  EditIcon,
  TrashIcon,
  CrownIcon
} from 'lucide-react';
import { getStatusColor, getStatusText, getPriorityColor, getPriorityText, formatDate } from '@/lib/utils';
import type { Team, TeamForm, User } from '@/types';

export default function TeamsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: teams, isLoading, error } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamApi.getTeams(),
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getUsers(),
  });

  const createMutation = useMutation({
    mutationFn: (data: TeamForm) => teamApi.createTeam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setShowCreateModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TeamForm }) => teamApi.updateTeam(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setEditingTeam(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => teamApi.deleteTeam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });

  const filteredTeams = teams?.data?.data?.filter((team: Team) =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
          <p className="text-red-600">Terjadi kesalahan saat memuat data tim</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tim</h1>
            <p className="text-gray-600">Kelola tim dan anggota proyek</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Buat Tim Baru
          </button>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Cari tim..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="p-6">
            {filteredTeams.length === 0 ? (
              <div className="text-center py-8">
                <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Belum ada tim yang dibuat</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeams.map((team: Team) => (
                  <div key={team.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-3"
                          style={{ backgroundColor: team.color }}
                        />
                        <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                      </div>
                      <div className="relative">
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVerticalIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {team.description && (
                      <p className="text-gray-600 text-sm mb-4">{team.description}</p>
                    )}

                    <div className="space-y-2 mb-4">
                      {team.leader && (
                        <div className="flex items-center text-sm text-gray-600">
                          <CrownIcon className="h-4 w-4 mr-2 text-yellow-500" />
                          <span>Pemimpin: {team.leader.name}</span>
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <UsersIcon className="h-4 w-4 mr-2" />
                        <span>Anggota: 0</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        team.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {team.is_active ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingTeam(team)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <EditIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Apakah Anda yakin ingin menghapus tim ini?')) {
                              deleteMutation.mutate(team.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-800"
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

      {(showCreateModal || editingTeam) && (
        <TeamModal
          team={editingTeam}
          users={(users as any)?.data?.data || users || []}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTeam(null);
          }}
          onSubmit={(data) => {
            if (editingTeam) {
              updateMutation.mutate({ id: editingTeam.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
        />
      )}
    </MainLayout>
  );
}

function TeamModal({ 
  team, 
  users, 
  onClose, 
  onSubmit 
}: { 
  team: Team | null; 
  users: User[];
  onClose: () => void; 
  onSubmit: (data: TeamForm) => void; 
}) {
  const [formData, setFormData] = useState<TeamForm>({
    name: team?.name || '',
    description: team?.description || '',
    color: team?.color || '#3B82F6',
    leader_id: team?.leader_id || undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'leader_id' ? (value ? parseInt(value) : undefined) : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {team ? 'Edit Tim' : 'Buat Tim Baru'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Tim
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
              value={formData.description || ''}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pemimpin Tim
            </label>
            <select
              name="leader_id"
              value={formData.leader_id || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Pemimpin</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Warna Tim
            </label>
            <input
              type="color"
              name="color"
              value={formData.color || '#3B82F6'}
              onChange={handleChange}
              className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {team ? 'Perbarui' : 'Buat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
