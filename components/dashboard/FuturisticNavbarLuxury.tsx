'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Sun, Moon, Home, LogOut } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import { signOut } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { getDashboardTheme, DashboardRole } from '@/lib/dashboardThemes';
import { logger } from '@/lib/logger';

interface FuturisticNavbarLuxuryProps {
  userName?: string;
  userRole?: DashboardRole;
  notificationCount?: number;
}

export default function FuturisticNavbarLuxury({
  userName: propUserName,
  userRole = 'admin',
  notificationCount = 0,
}: FuturisticNavbarLuxuryProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userName, setUserName] = useState(propUserName || 'المستخدم');
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const dashboardTheme = getDashboardTheme(userRole);

  useEffect(() => {
    if (!propUserName) {
      fetchUserName();
    }
  }, [propUserName]);

  const fetchUserName = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single();
        
        if (userData?.name) {
          setUserName(userData.name);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error fetching user name'
      
      logger.error('fetchUserName failed', {
        error: errorMessage,
        component: 'FuturisticNavbarLuxury',
        userRole,
      })
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/auth/login');
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'خطأ في تسجيل الخروج'
      
      logger.error('handleLogout failed', {
        error: errorMessage,
        component: 'FuturisticNavbarLuxury',
        userRole,
      })
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const searchPath = userRole === 'admin'
        ? '/dashboard/admin'
        : userRole === 'vendor'
        ? '/dashboard/vendor/products'
        : userRole === 'restaurant'
        ? '/dashboard/restaurant/products'
        : '/dashboard/driver/available';
      
      router.push(`${searchPath}?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  return (
    <nav
      className="fixed top-0 right-0 left-0 md:right-[280px] h-14 sm:h-16 md:h-20 z-40 transition-all duration-300 backdrop-blur-md border-b bg-white/80 dark:bg-[#161B2A]/80 border-slate-100 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]"
    >
      <div className="h-full px-3 sm:px-4 md:px-6 flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
        {/* Logo - Link to Home */}
        <Link 
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="text-lg sm:text-xl md:text-2xl font-black"
            style={{
              background: `linear-gradient(135deg, ${dashboardTheme.primary.light}, ${dashboardTheme.primary.main})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            بوابتي
          </motion.div>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-md md:max-w-2xl">
          <form onSubmit={handleSearch}>
            <motion.div
              initial={false}
              animate={{ width: searchOpen ? '100%' : 'auto' }}
              className="relative"
            >
              <input
                type="text"
                placeholder="ابحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                className="w-full px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 pr-9 sm:pr-10 md:pr-12 rounded-xl sm:rounded-2xl text-sm sm:text-base transition-all duration-300 outline-none bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-white/40 focus:border-slate-300 dark:focus:border-white/20"
              />
              <button
                type="submit"
                className="absolute left-2 sm:left-3 md:left-4 top-1/2 -translate-y-1/2 transition-opacity"
                style={{ color: dashboardTheme.primary.main }}
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </motion.div>
          </form>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4">
          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="hidden sm:flex w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl items-center justify-center transition-all border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10"
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 md:w-5 md:h-5" style={{ color: dashboardTheme.primary.main }} />
            ) : (
              <Moon className="w-4 h-4 md:w-5 md:h-5" style={{ color: dashboardTheme.primary.main }} />
            )}
          </motion.button>

          {/* Notifications */}
          <div className="scale-75 sm:scale-90 md:scale-100">
            <NotificationBell />
          </div>

          {/* Logout Button - Hidden on mobile */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleLogout}
            className="hidden sm:flex w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl items-center justify-center transition-all group border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4 md:w-5 md:h-5 text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300" />
          </motion.button>

          {/* User Profile */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl cursor-pointer border transition-all"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderColor: dashboardTheme.colors.border,
            }}
          >
            <div className="text-right hidden lg:block">
              <p className="text-white text-xs sm:text-sm font-semibold">{userName}</p>
              <p className="text-white/50 text-[10px] sm:text-xs">{dashboardTheme.title}</p>
            </div>
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${dashboardTheme.primary.main}, ${dashboardTheme.primary.dark})`,
                boxShadow: `0 0 20px ${dashboardTheme.glow.primary}`,
              }}
            >
              <User className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-white" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Animated gradient line */}
      <motion.div
        className="absolute bottom-0 left-0 w-full h-1"
        style={{
          background: `linear-gradient(90deg, ${dashboardTheme.primary.light}, ${dashboardTheme.primary.main}, ${dashboardTheme.primary.dark})`,
        }}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </nav>
  );
}
