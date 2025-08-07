import axios from 'axios';
import type { ApiResponse, AuthData, LoginForm, RegisterForm, User, Project, Task, Team, DashboardData, Notification, SearchResults, CalendarEvent } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (data: LoginForm): Promise<ApiResponse<AuthData>> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterForm): Promise<ApiResponse<AuthData>> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<ApiResponse> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  me: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  refresh: async (): Promise<ApiResponse<{ token: string; token_type: string }>> => {
    const response = await api.post('/auth/refresh');
    return response.data;
  },
};

export const userApi = {
  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.put('/user/profile', data);
    return response.data;
  },

  changePassword: async (data: { current_password: string; password: string; password_confirmation: string }): Promise<ApiResponse> => {
    const response = await api.post('/user/change-password', data);
    return response.data;
  },

  getDashboard: async (): Promise<ApiResponse<DashboardData>> => {
    const response = await api.get('/user/dashboard');
    return response.data;
  },

  getUsers: async (params?: Record<string, any>): Promise<ApiResponse<User[]>> => {
    const response = await api.get('/users', { params });
    return response.data;
  },
};

export const projectApi = {
  getProjects: async (params?: Record<string, any>): Promise<ApiResponse<{ data: Project[] }>> => {
    const response = await api.get('/projects', { params });
    return response.data;
  },

  getProject: async (id: number): Promise<ApiResponse<Project>> => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  createProject: async (data: any): Promise<ApiResponse<Project>> => {
    const response = await api.post('/projects', data);
    return response.data;
  },

  updateProject: async (id: number, data: any): Promise<ApiResponse<Project>> => {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  },

  deleteProject: async (id: number): Promise<ApiResponse> => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },

  getProjectMembers: async (id: number): Promise<ApiResponse<any[]>> => {
    const response = await api.get(`/projects/${id}/members`);
    return response.data;
  },

  addProjectMember: async (id: number, data: any): Promise<ApiResponse> => {
    const response = await api.post(`/projects/${id}/members`, data);
    return response.data;
  },

  removeProjectMember: async (projectId: number, userId: number): Promise<ApiResponse> => {
    const response = await api.delete(`/projects/${projectId}/members/${userId}`);
    return response.data;
  },

  getProjectStatistics: async (id: number): Promise<ApiResponse<any>> => {
    const response = await api.get(`/projects/${id}/statistics`);
    return response.data;
  },
};

export const taskApi = {
  getTasks: async (params?: Record<string, any>): Promise<ApiResponse<{ data: Task[] }>> => {
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  getProjectTasks: async (projectId: number, params?: Record<string, any>): Promise<ApiResponse<{ data: Task[] }>> => {
    const response = await api.get(`/projects/${projectId}/tasks`, { params });
    return response.data;
  },

  getTask: async (id: number): Promise<ApiResponse<Task>> => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  createTask: async (data: any): Promise<ApiResponse<Task>> => {
    const response = await api.post(`/projects/${data.project_id}/tasks`, data);
    return response.data;
  },

  updateTask: async (id: number, data: any): Promise<ApiResponse<Task>> => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  deleteTask: async (id: number): Promise<ApiResponse> => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  assignTask: async (id: number, data: { user_id: number }): Promise<ApiResponse> => {
    const response = await api.post(`/tasks/${id}/assign`, data);
    return response.data;
  },

  unassignTask: async (taskId: number, userId: number): Promise<ApiResponse> => {
    const response = await api.delete(`/tasks/${taskId}/assign/${userId}`);
    return response.data;
  },

  startTimeTracking: async (id: number): Promise<ApiResponse> => {
    const response = await api.post(`/tasks/${id}/time-tracking/start`);
    return response.data;
  },

  stopTimeTracking: async (id: number): Promise<ApiResponse> => {
    const response = await api.post(`/tasks/${id}/time-tracking/stop`);
    return response.data;
  },

  getTimeTracking: async (id: number): Promise<ApiResponse<any[]>> => {
    const response = await api.get(`/tasks/${id}/time-tracking`);
    return response.data;
  },
};

export const teamApi = {
  getTeams: async (params?: Record<string, any>): Promise<ApiResponse<{ data: Team[] }>> => {
    const response = await api.get('/teams', { params });
    return response.data;
  },

  getTeam: async (id: number): Promise<ApiResponse<Team>> => {
    const response = await api.get(`/teams/${id}`);
    return response.data;
  },

  createTeam: async (data: any): Promise<ApiResponse<Team>> => {
    const response = await api.post('/teams', data);
    return response.data;
  },

  updateTeam: async (id: number, data: any): Promise<ApiResponse<Team>> => {
    const response = await api.put(`/teams/${id}`, data);
    return response.data;
  },

  deleteTeam: async (id: number): Promise<ApiResponse> => {
    const response = await api.delete(`/teams/${id}`);
    return response.data;
  },

  getTeamMembers: async (id: number): Promise<ApiResponse<any[]>> => {
    const response = await api.get(`/teams/${id}/members`);
    return response.data;
  },

  addTeamMember: async (id: number, data: any): Promise<ApiResponse> => {
    const response = await api.post(`/teams/${id}/members`, data);
    return response.data;
  },

  removeTeamMember: async (teamId: number, userId: number): Promise<ApiResponse> => {
    const response = await api.delete(`/teams/${teamId}/members/${userId}`);
    return response.data;
  },
};

export const notificationApi = {
  getNotifications: async (params?: Record<string, any>): Promise<ApiResponse<{ data: Notification[] }>> => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  markAsRead: async (id: number): Promise<ApiResponse> => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<ApiResponse> => {
    const response = await api.post('/notifications/mark-all-read');
    return response.data;
  },

  getUnreadCount: async (): Promise<ApiResponse<{ unread_count: number }>> => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  deleteNotification: async (id: number): Promise<ApiResponse> => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
};

export const searchApi = {
  globalSearch: async (query: string, types?: string[], limit?: number): Promise<ApiResponse<SearchResults>> => {
    const response = await api.get('/search/global', {
      params: { query, types, limit }
    });
    return response.data;
  },

  searchProjects: async (params: Record<string, any>): Promise<ApiResponse<{ data: Project[] }>> => {
    const response = await api.get('/search/projects', { params });
    return response.data;
  },

  searchTasks: async (params: Record<string, any>): Promise<ApiResponse<{ data: Task[] }>> => {
    const response = await api.get('/search/tasks', { params });
    return response.data;
  },

  searchUsers: async (params: Record<string, any>): Promise<ApiResponse<{ data: User[] }>> => {
    const response = await api.get('/search/users', { params });
    return response.data;
  },

  getSuggestions: async (query: string, type: string, limit?: number): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/search/suggestions', {
      params: { query, type, limit }
    });
    return response.data;
  },
};

export const calendarApi = {
  getCalendarData: async (startDate: string, endDate: string): Promise<ApiResponse<CalendarEvent[]>> => {
    const response = await api.get('/calendar', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },

  getGanttData: async (projectId?: number): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/calendar/gantt', {
      params: { project_id: projectId }
    });
    return response.data;
  },

  updateTaskDates: async (taskId: number, data: { start_date?: string; due_date?: string }): Promise<ApiResponse> => {
    const response = await api.put(`/calendar/tasks/${taskId}/dates`, data);
    return response.data;
  },

  getMilestones: async (projectId?: number): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/calendar/milestones', {
      params: { project_id: projectId }
    });
    return response.data;
  },

  getWorkload: async (userId?: number, startDate?: string, endDate?: string): Promise<ApiResponse<any>> => {
    const response = await api.get('/calendar/workload', {
      params: { user_id: userId, start_date: startDate, end_date: endDate }
    });
    return response.data;
  },
};

export const reportApi = {
  getTimeTrackingReport: async (params: Record<string, any>): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/reports/time-tracking', { params });
    return response.data;
  },

  getTimeReport: async (params: Record<string, any>): Promise<ApiResponse<any>> => {
    const response = await api.get('/reports/time-tracking', { params });
    return response.data;
  },

  getProjectStatistics: async (params?: Record<string, any>): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/reports/project-statistics', { params });
    return response.data;
  },

  getProjectReport: async (params: Record<string, any>): Promise<ApiResponse<any>> => {
    const response = await api.get('/reports/project-statistics', { params });
    return response.data;
  },

  getTaskAnalytics: async (params?: Record<string, any>): Promise<ApiResponse<any>> => {
    const response = await api.get('/reports/task-analytics', { params });
    return response.data;
  },

  getUserPerformance: async (params?: Record<string, any>): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/reports/user-performance', { params });
    return response.data;
  },

  getUserReport: async (params: Record<string, any>): Promise<ApiResponse<any>> => {
    const response = await api.get('/reports/user-performance', { params });
    return response.data;
  },

  exportReport: async (data: { type: string; format: string; start_date: string; end_date: string }): Promise<ApiResponse<any>> => {
    const response = await api.post('/reports/export', data);
    return response.data;
  },
};

export const documentApi = {
  getDocuments: async (params?: Record<string, any>): Promise<ApiResponse<{ data: Document[] }>> => {
    const response = await api.get('/documents', { params });
    return response.data;
  },

  getDocument: async (id: number): Promise<ApiResponse<Document>> => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  uploadDocument: async (formData: FormData): Promise<ApiResponse<Document>> => {
    const response = await api.post('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateDocument: async (id: number, data: any): Promise<ApiResponse<Document>> => {
    const response = await api.put(`/documents/${id}`, data);
    return response.data;
  },

  deleteDocument: async (id: number): Promise<ApiResponse> => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },

  downloadDocument: async (id: number): Promise<Blob> => {
    const response = await api.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  getDocumentVersions: async (id: number): Promise<ApiResponse<any[]>> => {
    const response = await api.get(`/documents/${id}/versions`);
    return response.data;
  },

  createDocumentVersion: async (id: number, formData: FormData): Promise<ApiResponse<Document>> => {
    const response = await api.post(`/documents/${id}/versions`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default api;
