'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Package, MessageCircle, Star, Gift, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'order' | 'message' | 'review' | 'loyalty' | 'system' | 'promotion';
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  // جلب معرف المستخدم
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchNotifications(user.id);
      }
    };
    getUser();
  }, []);

  // جلب الإشعارات
  const fetchNotifications = async (uid: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  // Realtime Subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // إظهار إشعار مؤقت
          showToast(newNotification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // إظهار Toast notification
  const showToast = (notification: Notification) => {
    // يمكن استخدام مكتبة toast مثل react-hot-toast
  };

  // تحديد الأيقونة حسب النوع
  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <Package className="w-5 h-5" />;
      case 'message': return <MessageCircle className="w-5 h-5" />;
      case 'review': return <Star className="w-5 h-5" />;
      case 'loyalty': return <Gift className="w-5 h-5" />;
      case 'promotion': return <AlertCircle className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  // تحديد اللون حسب النوع
  const getColor = (type: string) => {
    switch (type) {
      case 'order': return 'from-blue-500 to-cyan-500';
      case 'message': return 'from-purple-500 to-pink-500';
      case 'review': return 'from-yellow-500 to-orange-500';
      case 'loyalty': return 'from-emerald-500 to-teal-500';
      case 'promotion': return 'from-red-500 to-rose-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  // تحديد الإشعار كمقروء
  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // تحديد جميع الإشعارات كمقروءة
  const markAllAsRead = async () => {
    if (!userId) return;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  // حذف إشعار
  const deleteNotification = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // تنسيق الوقت
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    return date.toLocaleDateString('ar-SA');
  };

  return (
    <div className="relative">
      {/* زر الجرس */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-12 h-12 rounded-xl flex items-center justify-center transition-colors bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-[rgba(98,54,255,0.3)]"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-purple-300" />
        
        {/* نقطة حمراء للإشعارات غير المقروءة */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-xs font-bold text-white"
            style={{
              boxShadow: '0 0 20px rgba(255, 33, 157, 0.6)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}

        {/* أنيميشن نبض للجرس */}
        {unreadCount > 0 && (
          <motion.div
            className="absolute inset-0 rounded-xl"
            animate={{
              boxShadow: [
                '0 0 0 0 rgba(255, 33, 157, 0.7)',
                '0 0 0 10px rgba(255, 33, 157, 0)',
              ],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        )}
      </motion.button>

      {/* قائمة الإشعارات */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute left-0 mt-2 w-96 rounded-3xl overflow-hidden shadow-2xl z-50 bg-white dark:bg-[rgba(15,10,30,0.98)] backdrop-blur-xl border border-gray-200 dark:border-[rgba(98,54,255,0.3)]"
              style={{
                maxHeight: '600px',
              }}
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-purple-500/20 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">الإشعارات</h3>
                  {unreadCount > 0 && (
                    <p className="text-sm text-gray-600 dark:text-purple-300">{unreadCount} إشعار جديد</p>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    تحديد الكل كمقروء
                  </button>
                )}
              </div>

              {/* قائمة الإشعارات */}
              <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-purple-300/30" />
                    <p className="text-gray-500 dark:text-purple-300/50">لا توجد إشعارات</p>
                  </div>
                ) : (
                  <div className="divide-y divide-purple-500/10">
                    {notifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer ${
                          !notification.is_read ? 'bg-purple-100 dark:bg-purple-500/5' : ''
                        }`}
                        onClick={() => {
                          markAsRead(notification.id);
                          if (notification.link) {
                            window.location.href = notification.link;
                          }
                        }}
                      >
                        <div className="flex gap-3">
                          {/* أيقونة */}
                          <div
                            className={`w-10 h-10 flex-shrink-0 rounded-xl bg-gradient-to-br ${getColor(notification.type)} flex items-center justify-center text-white`}
                          >
                            {getIcon(notification.type)}
                          </div>

                          {/* المحتوى */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                {notification.title}
                              </h4>
                              {!notification.is_read && (
                                <span className="w-2 h-2 rounded-full bg-pink-500 flex-shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-gray-600 dark:text-purple-200 text-xs mb-2 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500 dark:text-purple-400 text-xs">
                                {formatTime(notification.created_at)}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="text-red-400 hover:text-red-300 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-200 dark:border-purple-500/20 text-center">
                  <Link
                    href="/notifications"
                    className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    عرض جميع الإشعارات
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

