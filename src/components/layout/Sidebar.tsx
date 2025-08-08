'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
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

  const sidebarVariants = {
    hidden: { x: -264, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div 
      className="flex flex-col w-64 bg-gray-800"
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="flex items-center h-16 px-4 bg-gray-900"
        variants={itemVariants}
      >
        <motion.h1 
          className="text-white text-lg font-semibold"
          whileHover={{ scale: 1.02 }}
        >
          Sistem Manajemen Proyek
        </motion.h1>
      </motion.div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item, index) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <motion.div
              key={item.name}
              variants={itemVariants}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href={item.href}
                className={cn(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200',
                  isActive
                    ? 'bg-gray-900 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white hover:shadow-md'
                )}
              >
                <motion.div
                  whileHover={{ rotate: 5, scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 transition-colors duration-200',
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                    )}
                  />
                </motion.div>
                <motion.span
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.name}
                </motion.span>
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </motion.div>
  );
}
