import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, formatStr: string = 'dd/MM/yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: idLocale });
}

export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: idLocale });
}

export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(dateObj)) {
    return `Hari ini ${format(dateObj, 'HH:mm')}`;
  }
  
  if (isYesterday(dateObj)) {
    return `Kemarin ${format(dateObj, 'HH:mm')}`;
  }
  
  return formatDistanceToNow(dateObj, { 
    addSuffix: true, 
    locale: idLocale 
  });
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    on_hold: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    todo: 'bg-gray-100 text-gray-800',
    review: 'bg-purple-100 text-purple-800',
    done: 'bg-green-100 text-green-800',
  };
  
  return statusColors[status] || 'bg-gray-100 text-gray-800';
}

export function getPriorityColor(priority: string): string {
  const priorityColors: Record<string, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };
  
  return priorityColors[priority] || 'bg-gray-100 text-gray-800';
}

export function getStatusText(status: string): string {
  const statusTexts: Record<string, string> = {
    draft: 'Draft',
    in_progress: 'Sedang Berjalan',
    on_hold: 'Ditunda',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
    todo: 'Belum Dikerjakan',
    review: 'Review',
    done: 'Selesai',
  };
  
  return statusTexts[status] || status;
}

export function getPriorityText(priority: string): string {
  const priorityTexts: Record<string, string> = {
    low: 'Rendah',
    medium: 'Sedang',
    high: 'Tinggi',
    urgent: 'Mendesak',
  };
  
  return priorityTexts[priority] || priority;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getRandomColor(): string {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1',
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins} menit`;
  }
  
  if (mins === 0) {
    return `${hours} jam`;
  }
  
  return `${hours} jam ${mins} menit`;
}

export function parseDuration(duration: string): number {
  const hourMatch = duration.match(/(\d+(?:\.\d+)?)\s*h/);
  const minuteMatch = duration.match(/(\d+)\s*m/);
  
  let totalMinutes = 0;
  
  if (hourMatch) {
    totalMinutes += parseFloat(hourMatch[1]) * 60;
  }
  
  if (minuteMatch) {
    totalMinutes += parseInt(minuteMatch[1]);
  }
  
  return totalMinutes;
}

export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission) || userPermissions.includes('*');
}

export function canAccessResource(userRole: string, resourceOwner: number, userId: number): boolean {
  if (['super_admin', 'admin'].includes(userRole)) {
    return true;
  }
  
  if (resourceOwner === userId) {
    return true;
  }
  
  return false;
}

export function getErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'Terjadi kesalahan yang tidak diketahui';
}

export function getValidationErrors(error: any): Record<string, string[]> {
  if (error?.response?.data?.errors) {
    return error.response.data.errors;
  }
  
  return {};
}

export function getRelativeTime(date: string | Date): string {
  return formatRelativeTime(date);
}
