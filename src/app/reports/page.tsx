'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportApi, projectApi, userApi } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  BarChart3Icon, 
  TrendingUpIcon, 
  ClockIcon,
  UsersIcon,
  DownloadIcon,
  CalendarIcon,
  FilterIcon
} from 'lucide-react';
import { formatDate, formatDuration } from '@/lib/utils';
import type { Project, User } from '@/types';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [reportType, setReportType] = useState<'time' | 'project' | 'user'>('time');

  const { data: timeReport, isLoading: timeLoading } = useQuery({
    queryKey: ['reports', 'time', dateRange, selectedProject, selectedUser],
    queryFn: () => reportApi.getTimeReport({
      ...dateRange,
      project_id: selectedProject || undefined,
      user_id: selectedUser || undefined,
    }),
    enabled: reportType === 'time',
  });

  const { data: projectReport, isLoading: projectLoading } = useQuery({
    queryKey: ['reports', 'project', dateRange, selectedProject],
    queryFn: () => reportApi.getProjectReport({
      ...dateRange,
      project_id: selectedProject || undefined,
    }),
    enabled: reportType === 'project',
  });

  const { data: userReport, isLoading: userLoading } = useQuery({
    queryKey: ['reports', 'user', dateRange, selectedUser],
    queryFn: () => reportApi.getUserReport({
      ...dateRange,
      user_id: selectedUser || undefined,
    }),
    enabled: reportType === 'user',
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectApi.getProjects(),
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getUsers(),
  });

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      const params = {
        type: reportType,
        format,
        ...dateRange,
        project_id: selectedProject || undefined,
        user_id: selectedUser || undefined,
      };
      
      const response = await reportApi.exportReport(params);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `laporan-${reportType}-${dateRange.start_date}-${dateRange.end_date}.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const isLoading = timeLoading || projectLoading || userLoading;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>
            <p className="text-gray-600">Analisis kinerja proyek dan tim</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleExport('pdf')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center"
            >
              <DownloadIcon className="h-5 w-5 mr-2" />
              Export PDF
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
            >
              <DownloadIcon className="h-5 w-5 mr-2" />
              Export Excel
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setReportType('time')}
                  className={`px-4 py-2 rounded-lg flex items-center ${
                    reportType === 'time' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ClockIcon className="h-5 w-5 mr-2" />
                  Waktu Kerja
                </button>
                <button
                  onClick={() => setReportType('project')}
                  className={`px-4 py-2 rounded-lg flex items-center ${
                    reportType === 'project' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <BarChart3Icon className="h-5 w-5 mr-2" />
                  Proyek
                </button>
                <button
                  onClick={() => setReportType('user')}
                  className={`px-4 py-2 rounded-lg flex items-center ${
                    reportType === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <UsersIcon className="h-5 w-5 mr-2" />
                  Pengguna
                </button>
              </div>

              <div className="flex flex-wrap gap-4 lg:ml-auto">
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    value={dateRange.start_date}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="date"
                    value={dateRange.end_date}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                {reportType !== 'project' && (
                  <select
                    value={selectedUser || ''}
                    onChange={(e) => setSelectedUser(e.target.value ? parseInt(e.target.value) : null)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Semua Pengguna</option>
                    {users?.data?.map((user: any) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="space-y-6">
                {reportType === 'time' && timeReport?.data && (
                  <TimeReportView data={timeReport.data} />
                )}
                {reportType === 'project' && projectReport?.data && (
                  <ProjectReportView data={projectReport.data} />
                )}
                {reportType === 'user' && userReport?.data && (
                  <UserReportView data={userReport.data} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function TimeReportView({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{data.total_hours || 0}h</div>
          <div className="text-sm text-gray-600">Total Jam Kerja</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{data.billable_hours || 0}h</div>
          <div className="text-sm text-gray-600">Jam Billable</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{data.projects_count || 0}</div>
          <div className="text-sm text-gray-600">Proyek Aktif</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{data.tasks_completed || 0}</div>
          <div className="text-sm text-gray-600">Tugas Selesai</div>
        </div>
      </div>

      {data.daily_breakdown && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Breakdown Harian</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jam Kerja
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tugas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proyek
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.daily_breakdown.map((day: any, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(day.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.hours}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.tasks_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.projects_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectReportView({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{data.total_projects || 0}</div>
          <div className="text-sm text-gray-600">Total Proyek</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{data.completed_projects || 0}</div>
          <div className="text-sm text-gray-600">Proyek Selesai</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{data.in_progress_projects || 0}</div>
          <div className="text-sm text-gray-600">Sedang Berjalan</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{data.overdue_projects || 0}</div>
          <div className="text-sm text-gray-600">Terlambat</div>
        </div>
      </div>

      {data.project_details && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Detail Proyek</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Proyek
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tugas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deadline
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.project_details.map((project: any, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {project.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.status === 'completed' ? 'bg-green-100 text-green-800' :
                        project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        project.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {project.progress}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {project.tasks_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {project.end_date ? formatDate(project.end_date) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function UserReportView({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{data.total_users || 0}</div>
          <div className="text-sm text-gray-600">Total Pengguna</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{data.active_users || 0}</div>
          <div className="text-sm text-gray-600">Pengguna Aktif</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{data.total_hours || 0}h</div>
          <div className="text-sm text-gray-600">Total Jam Kerja</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{data.tasks_completed || 0}</div>
          <div className="text-sm text-gray-600">Tugas Diselesaikan</div>
        </div>
      </div>

      {data.user_performance && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Performa Pengguna</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jam Kerja
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tugas Selesai
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proyek
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Efisiensi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.user_performance.map((user: any, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.hours_worked}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.tasks_completed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.projects_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.efficiency}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
