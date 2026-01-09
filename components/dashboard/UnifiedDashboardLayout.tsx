'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import GlobalSearch from './GlobalSearch';
import { Bell, Settings, LogOut, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

interface UnifiedDashboardLayoutProps {
  children: ReactNode;
  userRole: 'admin' | 'vendor' | 'restaurant' | 'driver';
  userId?: string;
  userName?: string;
  userAvatar?: string;
  sidebarItems: Array<{
    icon: any;
    label: string;
    href: string;
    badge?: number;
    active?: boolean;
  }>;
}

export default function UnifiedDashboardLayout({
  children,
  userRole,
  userId,
  userName = 'المستخدم',
  userAvatar,
  sidebarItems
}: UnifiedDashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const roleLabels = {
    admin: 'مدير',
    vendor: 'بائع',
    restaurant: 'مطعم',
    driver: 'سائق'
  };

  return (
    <div className="min-h-screen" style={{ background: '#0A0515' }}>
      {/* Top Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-40 backdrop-blur-xl border-b"
        style={{
          background: 'rgba(15, 10, 30, 0.8)',
          borderColor: 'rgba(98, 54, 255, 0.3)'
        }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo & Role */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">ب</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-white font-bold text-lg">بوابتي</h1>
                <p className="text-purple-300 text-sm">{roleLabels[userRole]}</p>
              </div>
            </div>

            {/* Global Search */}
            <div className="flex-1 max-w-2xl hidden md:block">
              <GlobalSearch userRole={userRole} userId={userId} />
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs flex items-center justify-center font-bold">
                    3
                  </span>
                </button>
              </div>

              {/* Settings */}
              <Link
                href={`/dashboard/${userRole}/settings`}
                className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </Link>

              {/* User Menu */}
              <div className="hidden sm:flex items-center gap-3 pr-3 border-r border-purple-500/30">
                <div className="text-right">
                  <p className="text-white text-sm font-medium">{userName}</p>
                  <p className="text-purple-300 text-xs">{roleLabels[userRole]}</p>
                </div>
                {userAvatar ? (
                  <img src={userAvatar} alt={userName} className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden mt-4">
            <GlobalSearch userRole={userRole} userId={userId} />
          </div>
        </div>
      </motion.header>

      {/* Layout Container */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <motion.aside
            initial={{ x: -100, opacity: 0 }}
            animate={{ 
              x: sidebarOpen || window.innerWidth >= 1024 ? 0 : -100,
              opacity: sidebarOpen || window.innerWidth >= 1024 ? 1 : 0
            }}
            className={`
              ${sidebarOpen ? 'fixed inset-0 z-30 lg:relative' : 'hidden lg:block'}
              lg:w-64 flex-shrink-0
            `}
          >
            {/* Mobile Overlay */}
            {sidebarOpen && (
              <div
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden absolute inset-0 bg-black/50 backdrop-blur-sm"
              />
            )}

            {/* Sidebar Content */}
            <div className="lg:sticky lg:top-24 relative z-40 lg:z-0 max-w-xs lg:max-w-none mx-auto lg:mx-0">
              <div
                className="rounded-2xl p-4 h-fit"
                style={{
                  background: 'rgba(15, 10, 30, 0.6)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(98, 54, 255, 0.3)'
                }}
              >
                <nav className="space-y-2">
                  {sidebarItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={index}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                          ${item.active 
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                            : 'text-purple-300 hover:bg-white/10 hover:text-white'
                          }
                        `}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="px-2 py-1 rounded-full bg-red-500 text-white text-xs font-bold">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>

                {/* Logout Button */}
                <button
                  className="w-full mt-4 flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            </div>
          </motion.aside>

          {/* Main Content */}
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 min-w-0"
          >
            {children}
          </motion.main>
        </div>
      </div>
    </div>
  );
}
