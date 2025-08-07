'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  BellIcon, 
  CheckIcon,
  XIcon,
  FilterIcon,
  SettingsIcon,
  MailIcon,
  MessageSquareIcon,
  CalendarIcon,
  UserIcon
} from 'lucide-react';
import { formatDate, getRelativeTime } from '@/lib/utils';
import type { Notification } from '@/types';

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: notifications, isLoading, error } = useQuery({
    queryKey: ['notifications', filter, typeFilter],
    queryFn: () => notificationApi.getNotifications({
      read: filter === 'read' ? true : filter === 'unread' ? false : undefined,
      type: typeFilter || undefined,
    }),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => notificationApi.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
      case 'task_updated':
      case 'task_completed':
        return <CheckIcon className="h-5 w-5 text-blue-600" />;
      case 'comment_added':
      case 'mention':
        return <MessageSquareIcon className="h-5 w-5 text-green-600" />;
      case 'deadline_approaching':
      case 'deadline_passed':
        return <CalendarIcon className="h-5 w-5 text-orange-600" />;
      case 'project_updated':
      case 'project_member_added':
        return <UserIcon className="h-5 w-5 text-purple-600" />;
      default:
        return <BellIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const filteredNotifications = notifications?.data?.data || [];

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
          <p className="text-red-600">Terjadi kesalahan saat memuat notifikasi</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifikasi</h1>
            <p className="text-gray-600">Kelola pemberitahuan dan pengingat</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => markAllAsReadMutation.mutate()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <CheckIcon className="h-5 w-5 mr-2" />
              Tandai Semua Dibaca
            </button>
            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center">
              <SettingsIcon className="h-5 w-5 mr-2" />
              Pengaturan
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg ${
                    filter === 'all' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-4 py-2 rounded-lg ${
                    filter === 'unread' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Belum Dibaca
                </button>
                <button
                  onClick={() => setFilter('read')}
                  className={`px-4 py-2 rounded-lg ${
                    filter === 'read' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Sudah Dibaca
                </button>
              </div>

              <div className="flex items-center space-x-2 sm:ml-auto">
                <FilterIcon className="h-5 w-5 text-gray-400" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Semua Tipe</option>
                  <option value="task_assigned">Tugas Ditugaskan</option>
                  <option value="task_updated">Tugas Diperbarui</option>
                  <option value="task_completed">Tugas Selesai</option>
                  <option value="comment_added">Komentar Baru</option>
                  <option value="mention">Disebutkan</option>
                  <option value="deadline_approaching">Deadline Mendekat</option>
                  <option value="deadline_passed">Deadline Terlewat</option>
                  <option value="project_updated">Proyek Diperbarui</option>
                </select>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8">
                <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Tidak ada notifikasi</p>
              </div>
            ) : (
              filteredNotifications.map((notification: Notification) => (
                <div
                  key={notification.id}
                  className={`p-6 border-l-4 ${getPriorityColor(notification.priority)} ${
                    !notification.read_at ? 'bg-blue-50' : 'bg-white'
                  } hover:bg-gray-50 transition-colors`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h3>
                          {!notification.read_at && (
                            <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{getRelativeTime(notification.created_at)}</span>
                          <span className="capitalize">{notification.priority}</span>
                          {notification.action_url && (
                            <a
                              href={notification.action_url}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Lihat Detail
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.read_at && (
                        <button
                          onClick={() => markAsReadMutation.mutate(notification.id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Tandai sebagai dibaca"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm('Apakah Anda yakin ingin menghapus notifikasi ini?')) {
                            deleteMutation.mutate(notification.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-800"
                        title="Hapus notifikasi"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
