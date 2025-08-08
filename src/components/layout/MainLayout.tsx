'use client';

import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import ProtectedRoute from './ProtectedRoute';
import PageTransition from '../ui/PageTransition';
import { motion } from 'framer-motion';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <ProtectedRoute>
      <motion.div 
        className="flex h-screen bg-gray-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <motion.main 
            className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <motion.div 
              className="container mx-auto px-6 py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <PageTransition>
                {children}
              </PageTransition>
            </motion.div>
          </motion.main>
        </div>
      </motion.div>
    </ProtectedRoute>
  );
}
