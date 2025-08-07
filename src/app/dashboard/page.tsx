'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { FolderIcon, CheckSquareIcon, ClockIcon, AlertTriangleIcon } from 'lucide-react';

export default function DashboardPage() {
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => userApi.getDashboard(),
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="text-center text-red-600">
          Terjadi kesalahan saat memuat data dashboard
        </div>
      </MainLayout>
    );
  }

  const stats = dashboardData?.data?.stats;
  const recentProjects = dashboardData?.data?.recent_projects || [];
  const recentTasks = dashboardData?.data?.recent_tasks || [];

  const statCards = [
    {
      title: 'Proyek Saya',
      value: stats?.owned_projects || 0,
      icon: FolderIcon,
      color: 'bg-blue-500',
    },
    {
      title: 'Proyek Anggota',
      value: stats?.member_projects || 0,
      icon: FolderIcon,
      color: 'bg-green-500',
    },
    {
      title: 'Tugas Ditugaskan',
      value: stats?.assigned_tasks || 0,
      icon: CheckSquareIcon,
      color: 'bg-yellow-500',
    },
    {
      title: 'Tugas Selesai',
      value: stats?.completed_tasks || 0,
      icon: CheckSquareIcon,
      color: 'bg-purple-500',
    },
    {
      title: 'Tugas Terlambat',
      value: stats?.overdue_tasks || 0,
      icon: AlertTriangleIcon,
      color: 'bg-red-500',
    },
    {
      title: 'Waktu Hari Ini',
      value: `${stats?.time_tracked_today || 0} menit`,
      icon: ClockIcon,
      color: 'bg-indigo-500',
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dasbor</h1>
          <p className="text-gray-600">Ringkasan aktivitas dan proyek Anda</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`${stat.color} rounded-md p-3`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.title}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Proyek Terbaru
              </h3>
              {recentProjects.length > 0 ? (
                <div className="space-y-3">
                  {recentProjects.slice(0, 5).map((project: any) => (
                    <div key={project.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-3"
                          style={{ backgroundColor: project.color }}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {project.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {project.status === 'in_progress' ? 'Sedang Berjalan' : project.status}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {project.progress}%
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Belum ada proyek</p>
              )}
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Tugas Terbaru
              </h3>
              {recentTasks.length > 0 ? (
                <div className="space-y-3">
                  {recentTasks.slice(0, 5).map((task: any) => (
                    <div key={task.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {task.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {task.project?.name}
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {task.status === 'todo' ? 'Belum Dikerjakan' : 
                         task.status === 'in_progress' ? 'Sedang Dikerjakan' :
                         task.status === 'review' ? 'Review' : 'Selesai'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Belum ada tugas</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
