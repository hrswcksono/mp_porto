export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  phone: string | null;
  bio: string | null;
  avatar: string | null;
  timezone: string;
  language: string;
  preferences: Record<string, any> | null;
  is_active: boolean;
  last_login_at: string | null;
  role_id: number;
  created_at: string;
  updated_at: string;
  role?: Role;
}

export interface Role {
  id: number;
  name: string;
  slug: string;
  description: string;
  permissions: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthData {
  user: User;
  token: string;
  token_type: string;
}

export interface Project {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  status: 'draft' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  progress: number;
  color: string;
  is_public: boolean;
  owner_id: number;
  team_id: number | null;
  settings: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  owner?: User;
  team?: Team;
  members?: ProjectMember[];
  tasks?: Task[];
}

export interface ProjectMember {
  id: number;
  project_id: number;
  user_id: number;
  role: string;
  permissions: Record<string, any> | null;
  is_active: boolean;
  joined_at: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  start_date: string | null;
  due_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  progress: number;
  checklist: any[] | null;
  tags: string[] | null;
  project_id: number;
  parent_task_id: number | null;
  created_by: number;
  assigned_to: number | null;
  dependencies: number[] | null;
  order: number;
  created_at: string;
  updated_at: string;
  project?: Project;
  parent_task?: Task;
  subtasks?: Task[];
  creator?: User;
  assignee?: User;
  assigned_users?: User[];
}

export interface Team {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  is_active: boolean;
  leader_id: number;
  settings: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  leader?: User;
  projects?: Project[];
}

export interface DashboardStats {
  owned_projects: number;
  member_projects: number;
  assigned_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  time_tracked_today: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recent_projects: Project[];
  recent_tasks: Task[];
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  notifiable_type: string | null;
  notifiable_id: number | null;
  action_url: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  data: Record<string, any>;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  content: string;
  commentable_type: string;
  commentable_id: number;
  user_id: number;
  parent_id: number | null;
  is_edited: boolean;
  likes_count: number;
  created_at: string;
  updated_at: string;
  user?: User;
  replies?: Comment[];
}

export interface Document {
  id: number;
  name: string;
  description: string | null;
  file_path: string;
  file_size: number;
  mime_type: string;
  type: string;
  version: string;
  is_public: boolean;
  documentable_type: string;
  documentable_id: number;
  uploaded_by: number;
  created_at: string;
  updated_at: string;
  uploader?: User;
}

export interface SearchResults {
  projects: Project[];
  tasks: Task[];
  users: User[];
  comments: Comment[];
  documents: Document[];
}

export interface CalendarEvent {
  id: number;
  title: string;
  description: string | null;
  start: string | null;
  end: string;
  status: string;
  priority: string;
  project: {
    id: number;
    name: string;
    color: string;
  };
  assignee: User | null;
  type: string;
  color: string;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  bio?: string;
  timezone?: string;
  language?: string;
}

export interface ProjectForm {
  name: string;
  description?: string;
  status: Project['status'];
  priority: Project['priority'];
  start_date?: string;
  end_date?: string;
  budget?: number;
  color?: string;
  is_public?: boolean;
  team_id?: number;
}

export interface TaskForm {
  title: string;
  description?: string;
  status: Task['status'];
  priority: Task['priority'];
  project_id?: number;
  start_date?: string;
  due_date?: string;
  estimated_hours?: number;
  parent_task_id?: number;
  assigned_to?: number;
  dependencies?: number[];
}

export interface TeamForm {
  name: string;
  description?: string;
  color?: string;
  leader_id?: number;
}
