'use client';

import { useState } from 'react';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50" dir="rtl">
      <FuturisticSidebar
        role="admin"
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <FuturisticNavbar
          userRole="admin"
        />
        
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
