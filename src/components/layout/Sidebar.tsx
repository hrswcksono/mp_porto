'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  HomeIcon,
  FolderIcon,
  CheckSquareIcon,
  UsersIcon,
  CalendarIcon,
  FileTextIcon,
  MessageSquareIcon,
  BarChart3Icon,
  BellIcon,
  SearchIcon,
  SettingsIcon,
} from 'lucide-react';

const navigation = [
  { name: 'Dasbor', href: '/dashboard', icon: HomeIcon },
  { name: 'Proyek', href: '/projects', icon: FolderIcon },
  { name: 'Tugas', href: '/tasks', icon: CheckSquareIcon },
  { name: 'Tim', href: '/teams', icon: UsersIcon },
  { name: 'Kalender', href: '/calendar', icon: CalendarIcon },
  { name: 'Dokumen', href: '/documents', icon: FileTextIcon },
  { name: 'Diskusi', href: '/comments', icon: MessageSquareIcon },
  { name: 'Laporan', href: '/reports', icon: BarChart3Icon },
  { name: 'Notifikasi', href: '/notifications', icon: BellIcon },
  { name: 'Pencarian', href: '/search', icon: SearchIcon },
  { name: 'Pengaturan', href: '/settings', icon: SettingsIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-gray-800">
      <div className="flex items-center h-16 px-4 bg-gray-900">
        <h1 className="text-white text-lg font-semibold">
          Sistem Manajemen Proyek
        </h1>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5',
                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
