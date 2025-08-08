'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BellIcon, UserIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationApi.getUnreadCount(),
    refetchInterval: 30000,
  });

  const handleLogout = async () => {
    await logout();
  };

  return (
    <motion.header 
      className="bg-white shadow-sm border-b border-gray-200"
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between h-16 px-4">
        <motion.div 
          className="flex items-center"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h2 className="text-xl font-semibold text-gray-900">
            Selamat datang, {user?.name}
          </h2>
        </motion.div>
        
        <motion.div 
          className="flex items-center space-x-4"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <motion.button 
            className="relative p-2 text-gray-400 hover:text-gray-500 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              whileHover={{ rotate: 15 }}
              transition={{ duration: 0.2 }}
            >
              <BellIcon className="h-6 w-6" />
            </motion.div>
            <AnimatePresence>
              {(unreadCount?.data?.unread_count ?? 0) > 0 && (
                <motion.span 
                  className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </AnimatePresence>
          </motion.button>
          
          <div className="relative">
            <motion.button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center p-2 text-gray-400 hover:text-gray-500 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                whileHover={{ rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                <UserIcon className="h-6 w-6" />
              </motion.div>
            </motion.button>
            
            <AnimatePresence>
              {showUserMenu && (
                <motion.div 
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div 
                    className="px-4 py-2 text-sm text-gray-700 border-b"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="font-medium">{user?.name}</div>
                    <div className="text-gray-500">{user?.email}</div>
                  </motion.div>
                  <motion.a
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    whileHover={{ x: 4 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                  >
                    Profil
                  </motion.a>
                  <motion.a
                    href="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    whileHover={{ x: 4 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    Pengaturan
                  </motion.a>
                  <motion.button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    whileHover={{ x: 4 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                  >
                    Keluar
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.header>
  );
}
