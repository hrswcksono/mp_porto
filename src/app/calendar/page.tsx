'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { calendarApi, projectApi } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  CalendarIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  FilterIcon,
  BarChart3Icon
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { CalendarEvent, Project } from '@/types';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'calendar' | 'gantt'>('calendar');
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const { data: calendarData, isLoading } = useQuery({
    queryKey: ['calendar', startDate.toISOString(), endDate.toISOString()],
    queryFn: () => calendarApi.getCalendarData(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    ),
  });

  const { data: ganttData, isLoading: ganttLoading } = useQuery({
    queryKey: ['gantt', selectedProject],
    queryFn: () => calendarApi.getGanttData(selectedProject || undefined),
    enabled: view === 'gantt',
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectApi.getProjects(),
  });

  const { data: workload } = useQuery({
    queryKey: ['workload', startDate.toISOString(), endDate.toISOString()],
    queryFn: () => calendarApi.getWorkload(
      undefined,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    ),
  });

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    if (!calendarData?.data) return [];
    
    return calendarData.data.filter((event: CalendarEvent) => {
      const eventDate = new Date(event.start || event.end);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  if (isLoading && view === 'calendar') {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kalender</h1>
            <p className="text-gray-600">Lihat jadwal proyek dan tugas</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-2 rounded-lg flex items-center ${
                view === 'calendar' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <CalendarIcon className="h-5 w-5 mr-2" />
              Kalender
            </button>
            <button
              onClick={() => setView('gantt')}
              className={`px-4 py-2 rounded-lg flex items-center ${
                view === 'gantt' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart3Icon className="h-5 w-5 mr-2" />
              Gantt Chart
            </button>
          </div>
        </div>

        {view === 'calendar' ? (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <h2 className="text-xl font-semibold">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <FilterIcon className="h-5 w-5 text-gray-400" />
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
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {dayNames.map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth().map((date, index) => (
                  <div
                    key={index}
                    className={`min-h-[100px] p-2 border border-gray-100 ${
                      date ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                    }`}
                  >
                    {date && (
                      <>
                        <div className={`text-sm font-medium mb-1 ${
                          date.toDateString() === new Date().toDateString()
                            ? 'text-blue-600'
                            : 'text-gray-900'
                        }`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {getEventsForDate(date).slice(0, 3).map((event: CalendarEvent, eventIndex) => (
                            <div
                              key={eventIndex}
                              className="text-xs p-1 rounded truncate"
                              style={{ backgroundColor: event.color + '20', color: event.color }}
                            >
                              {event.title}
                            </div>
                          ))}
                          {getEventsForDate(date).length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{getEventsForDate(date).length - 3} lainnya
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Gantt Chart</h2>
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
              </div>
            </div>

            <div className="p-6">
              {ganttLoading ? (
                <div className="flex justify-center items-center h-64">
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="space-y-4">
                  {ganttData?.data?.length === 0 ? (
                    <div className="text-center py-8">
                      <BarChart3Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Belum ada data untuk ditampilkan</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <div className="min-w-[800px]">
                        {ganttData?.data?.map((item: any, index: number) => (
                          <div key={index} className="flex items-center py-2 border-b border-gray-100">
                            <div className="w-48 pr-4">
                              <div className="font-medium text-sm">{item.title}</div>
                              <div className="text-xs text-gray-500">{item.project?.name}</div>
                            </div>
                            <div className="flex-1 relative h-8 bg-gray-100 rounded">
                              <div
                                className="absolute h-full rounded"
                                style={{
                                  backgroundColor: item.color || '#3B82F6',
                                  left: `${item.startPercent || 0}%`,
                                  width: `${item.widthPercent || 10}%`,
                                }}
                              />
                            </div>
                            <div className="w-32 pl-4 text-xs text-gray-500">
                              {item.start_date && formatDate(item.start_date)} - {item.end_date && formatDate(item.end_date)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {workload?.data && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Beban Kerja</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{workload.data.total_tasks || 0}</div>
                  <div className="text-sm text-gray-500">Total Tugas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{workload.data.completed_tasks || 0}</div>
                  <div className="text-sm text-gray-500">Tugas Selesai</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{workload.data.overdue_tasks || 0}</div>
                  <div className="text-sm text-gray-500">Tugas Terlambat</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
