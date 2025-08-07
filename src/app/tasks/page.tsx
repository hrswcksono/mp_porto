'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi, projectApi } from '@/lib/api';
import MainLayout from '@/components/layout/MainLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { 
  PlusIcon, 
  CheckSquareIcon, 
  ClockIcon, 
  UserIcon,
  MoreVerticalIcon,
  EditIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  FlagIcon
} from 'lucide-react';
import { getStatusColor, getStatusText, getPriorityColor, getPriorityText, formatDate } from '@/lib/utils';
import type { Task, TaskForm } from '@/types';

export default function TasksPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const queryClient = useQueryClient();

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => taskApi.getTasks(),
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectApi.getProjects(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => taskApi.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowCreateModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TaskForm }) => 
      taskApi.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setEditingTask(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => taskApi.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const filteredTasks = tasks?.data?.data?.filter((task: Task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesProject = projectFilter === 'all' || task.project_id?.toString() === projectFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  }) || [];

  const kanbanColumns = [
    { id: 'todo', title: 'To Do', status: 'todo' },
    { id: 'in_progress', title: 'Sedang Dikerjakan', status: 'in_progress' },
    { id: 'review', title: 'Review', status: 'review' },
    { id: 'done', title: 'Selesai', status: 'done' }
  ];

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
          Terjadi kesalahan saat memuat data tugas
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tugas</h1>
            <p className="text-gray-600">Kelola semua tugas dan subtask</p>
          </div>
          <div className="flex space-x-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  viewMode === 'list' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Daftar
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  viewMode === 'kanban' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Kanban
              </button>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Buat Tugas Baru</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Cari tugas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Semua Status</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">Sedang Dikerjakan</option>
                  <option value="review">Review</option>
                  <option value="done">Selesai</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Semua Prioritas</option>
                  <option value="low">Rendah</option>
                  <option value="medium">Sedang</option>
                  <option value="high">Tinggi</option>
                  <option value="urgent">Mendesak</option>
                </select>
                <select
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Semua Proyek</option>
                  {projects?.data?.data?.map((project: any) => (
                    <option key={project.id} value={project.id.toString()}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="p-6">
            {viewMode === 'list' ? (
              <TaskListView 
                tasks={filteredTasks} 
                onEdit={setEditingTask}
                onDelete={(id) => {
                  if (confirm('Apakah Anda yakin ingin menghapus tugas ini?')) {
                    deleteMutation.mutate(id);
                  }
                }}
              />
            ) : (
              <TaskKanbanView 
                tasks={filteredTasks} 
                columns={kanbanColumns}
                onEdit={setEditingTask}
                onDelete={(id) => {
                  if (confirm('Apakah Anda yakin ingin menghapus tugas ini?')) {
                    deleteMutation.mutate(id);
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>

      {(showCreateModal || editingTask) && (
        <TaskModal
          task={editingTask}
          projects={projects?.data?.data || []}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTask(null);
          }}
          onSubmit={(data) => {
            if (editingTask) {
              updateMutation.mutate({ id: editingTask.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </MainLayout>
  );
}

interface TaskListViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}

function TaskListView({ tasks, onEdit, onDelete }: TaskListViewProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckSquareIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada tugas</h3>
        <p className="text-gray-600">Mulai dengan membuat tugas pertama Anda</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task: Task) => (
        <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                  {getStatusText(task.status)}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                  {getPriorityText(task.priority)}
                </span>
              </div>
              
              {task.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{task.description}</p>
              )}
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                {task.project && (
                  <div className="flex items-center">
                    <FlagIcon className="h-4 w-4 mr-1" />
                    <span>{task.project.name}</span>
                  </div>
                )}
                {task.due_date && (
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span>Deadline: {formatDate(task.due_date)}</span>
                  </div>
                )}
                {task.assigned_users && task.assigned_users.length > 0 && (
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-1" />
                    <span>{task.assigned_users.length} ditugaskan</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onEdit(task)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <EditIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(task.id)}
                className="p-2 text-gray-400 hover:text-red-600"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface TaskKanbanViewProps {
  tasks: Task[];
  columns: Array<{ id: string; title: string; status: string }>;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}

function TaskKanbanView({ tasks, columns, onEdit, onDelete }: TaskKanbanViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {columns.map((column) => {
        const columnTasks = tasks.filter(task => task.status === column.status);
        
        return (
          <div key={column.id} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{column.title}</h3>
              <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                {columnTasks.length}
              </span>
            </div>
            
            <div className="space-y-3">
              {columnTasks.map((task: Task) => (
                <div key={task.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{task.title}</h4>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => onEdit(task)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <EditIcon className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => onDelete(task.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <TrashIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {getPriorityText(task.priority)}
                    </span>
                    {task.due_date && (
                      <span className="text-xs text-gray-500">
                        {formatDate(task.due_date)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface TaskModalProps {
  task?: Task | null;
  projects: any[];
  onClose: () => void;
  onSubmit: (data: TaskForm) => void;
  isLoading: boolean;
}

function TaskModal({ task, projects, onClose, onSubmit, isLoading }: TaskModalProps) {
  const [formData, setFormData] = useState<TaskForm>({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    project_id: task?.project_id || undefined,
    due_date: task?.due_date || '',
    estimated_hours: task?.estimated_hours || undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? Number(value) : undefined) : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {task ? 'Edit Tugas' : 'Buat Tugas Baru'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Judul Tugas *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proyek
              </label>
              <select
                name="project_id"
                value={formData.project_id || ''}
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
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">Sedang Dikerjakan</option>
                <option value="review">Review</option>
                <option value="done">Selesai</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioritas
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Rendah</option>
                <option value="medium">Sedang</option>
                <option value="high">Tinggi</option>
                <option value="urgent">Mendesak</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimasi Jam
              </label>
              <input
                type="number"
                name="estimated_hours"
                value={formData.estimated_hours || ''}
                onChange={handleChange}
                min="0"
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deadline
            </label>
            <input
              type="date"
              name="due_date"
              value={formData.due_date ? formData.due_date.split('T')[0] : ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Menyimpan...' : (task ? 'Update' : 'Buat Tugas')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
