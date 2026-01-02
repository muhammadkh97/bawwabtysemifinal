'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Sun, Moon, Home, LogOut } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import { signOut } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';

interface FuturisticNavbarProps {
  userName?: string;
  userRole?: string;
  notificationCount?: number;
}

export default function FuturisticNavbar({
  userName: propUserName,
  userRole = 'مدير',
  notificationCount = 0,
}: FuturisticNavbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userName, setUserName] = useState(propUserName || 'المستخدم');
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    // Fetch user name from Supabase if not provided
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
      console.error('Error fetching user name:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/auth/login');
      router.refresh();
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // تحديد المسار حسب الدور
      const searchPath = userRole === 'مدير' || userRole === 'admin' 
        ? '/dashboard/admin' 
        : userRole === 'بائع' || userRole === 'vendor'
        ? '/dashboard/vendor/products'
        : '/dashboard/driver/available';
      
      router.push(`${searchPath}?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  return (
    <nav
      className="fixed top-0 right-0 left-0 md:right-[280px] h-14 sm:h-16 md:h-20 z-40 transition-all duration-300 bg-white/90 dark:bg-[rgba(15,10,30,0.9)] backdrop-blur-xl border-b border-gray-200 dark:border-[rgba(98,54,255,0.2)]"
    >
      <div className="h-full px-3 sm:px-4 md:px-6 flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
        {/* Logo - Link to Home */}
        <Link 
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="text-lg sm:text-xl md:text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
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
                className="w-full px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 pr-9 sm:pr-10 md:pr-12 rounded-xl sm:rounded-2xl text-sm sm:text-base transition-all duration-300 outline-none bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-[rgba(98,54,255,0.3)] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-purple-300/50"
              />
              <button
                type="submit"
                className="absolute left-2 sm:left-3 md:left-4 top-1/2 -translate-y-1/2 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-purple-300" />
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
            className="hidden sm:flex w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl items-center justify-center transition-colors bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-[rgba(98,54,255,0.3)]"
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
            ) : (
              <Moon className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
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
            className="hidden sm:flex w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl items-center justify-center transition-colors group bg-gray-100 dark:bg-white/5 border border-red-300 dark:border-[rgba(239,68,68,0.3)]"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4 md:w-5 md:h-5 text-red-500 dark:text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300" />
          </motion.button>

          {/* User Profile */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl cursor-pointer bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-[rgba(98,54,255,0.3)]"
          >
            <div className="text-right hidden lg:block">
              <p className="text-gray-900 dark:text-white text-xs sm:text-sm font-semibold">{userName}</p>
              <p className="text-gray-600 dark:text-purple-300 text-[10px] sm:text-xs">{userRole}</p>
            </div>
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#6236FF] to-[#FF219D] flex items-center justify-center"
              style={{
                boxShadow: '0 0 20px rgba(98, 54, 255, 0.5)',
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
          background: 'linear-gradient(90deg, #6236FF 0%, #B621FE 50%, #FF219D 100%)',
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
