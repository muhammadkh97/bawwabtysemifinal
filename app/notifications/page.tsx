'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, CheckCheck, Trash2, ArrowRight, Filter, Search, Mail, MailOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  subscribeToNotifications,
  getNotificationIcon,
  getNotificationColor,
  formatNotificationTime,
  type Notification,
} from '@/lib/notificationUtils'
import { useAuth } from '@/contexts/AuthContext'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()
  const { user } = useAuth()

  // Load notifications
  useEffect(() => {
    if (user) {
      loadNotifications()
      loadUnreadCount()
    } else {
      router.push('/login')
    }
  }, [user])

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user) return

    const unsubscribe = subscribeToNotifications(user.id, (notification) => {
      setNotifications((prev) => [notification, ...prev])
      setUnreadCount((prev) => prev + 1)
    })

    return unsubscribe
  }, [user])

  // Filter notifications
  useEffect(() => {
    let filtered = notifications

    // Filter by read status
    if (filter === 'unread') {
      filtered = filtered.filter((n) => !n.is_read)
    } else if (filter === 'read') {
      filtered = filtered.filter((n) => n.is_read)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (n) =>
          n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.message.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredNotifications(filtered)
  }, [notifications, filter, searchTerm])

  const loadNotifications = async () => {
    setLoading(true)
    const data = await getNotifications()
    setNotifications(data)
    setLoading(false)
  }

  const loadUnreadCount = async () => {
    const count = await getUnreadCount()
    setUnreadCount(count)
  }

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      await markAsRead(notification.id)
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }

    // Navigate to link
    if (notification.link) {
      router.push(notification.link)
    }
  }

  const handleMarkAllRead = async () => {
    await markAllAsRead()
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
    )
    setUnreadCount(0)
  }

  const handleDelete = async (
    e: React.MouseEvent,
    notificationId: string
  ) => {
    e.stopPropagation()
    
    if (confirm('هل أنت متأكد من حذف هذا الإشعار؟')) {
      await deleteNotification(notificationId)
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      loadUnreadCount()
    }
  }

  const handleDeleteAll = async () => {
    if (confirm('هل أنت متأكد من حذف جميع الإشعارات؟')) {
      const deletePromises = notifications.map((n) => deleteNotification(n.id))
      await Promise.all(deletePromises)
      setNotifications([])
      setUnreadCount(0)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0A1E] via-[#1E0F32] to-[#0F0A1E] py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
              >
                <ArrowRight className="w-6 h-6 text-white" />
              </button>
              
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Bell className="w-6 h-6 text-white" />
                  </div>
                  الإشعارات
                </h1>
                {unreadCount > 0 && (
                  <p className="text-purple-300 mt-2">
                    لديك {unreadCount} إشعار غير مقروء
                  </p>
                )}
              </div>
            </div>

            {notifications.length > 0 && (
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <CheckCheck className="w-5 h-5" />
                    تحديد الكل كمقروء
                  </button>
                )}
                
                <button
                  onClick={handleDeleteAll}
                  className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all flex items-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  حذف الكل
                </button>
              </div>
            )}
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Filter Tabs */}
            <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === 'all'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                الكل ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  filter === 'unread'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Mail className="w-4 h-4" />
                غير مقروء ({unreadCount})
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  filter === 'read'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <MailOpen className="w-4 h-4" />
                مقروء ({notifications.length - unreadCount})
              </button>
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="ابحث في الإشعارات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pr-12 pl-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-6">
              <Bell className="w-12 h-12 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {searchTerm
                ? 'لا توجد نتائج'
                : filter === 'unread'
                ? 'لا توجد إشعارات غير مقروءة'
                : 'لا توجد إشعارات'}
            </h3>
            <p className="text-gray-400 text-center max-w-md">
              {searchTerm
                ? 'جرب البحث بكلمات مختلفة'
                : 'سنقوم بإعلامك عند حدوث أي جديد'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`group p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                  !notification.is_read
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/30'
                    : 'bg-white/5 border-2 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center text-2xl">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-bold text-white text-lg">
                        {notification.title}
                      </h3>
                      {!notification.is_read && (
                        <div className="flex-shrink-0 w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"></div>
                      )}
                    </div>

                    <p className="text-gray-300 mb-3 leading-relaxed">
                      {notification.message}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getNotificationColor(notification.type)}`}>
                          {notification.type.includes('order') && '📦 طلب'}
                          {notification.type.includes('message') && '💬 رسالة'}
                          {notification.type.includes('driver') && '🚚 توصيل'}
                          {notification.type.includes('pending') && '⏳ قيد الانتظار'}
                          {notification.type.includes('approved') && '✅ مقبول'}
                          {notification.type.includes('rejected') && '❌ مرفوض'}
                          {notification.type === 'staff_invitation' && '👥 دعوة'}
                          {!notification.type.includes('order') && 
                           !notification.type.includes('message') && 
                           !notification.type.includes('driver') && 
                           !notification.type.includes('pending') && 
                           !notification.type.includes('approved') && 
                           !notification.type.includes('rejected') && 
                           notification.type !== 'staff_invitation' && '🔔 إشعار'}
                        </span>
                        •
                        {formatNotificationTime(notification.created_at)}
                      </span>

                      <button
                        onClick={(e) => handleDelete(e, notification.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-500/20 transition-all"
                        title="حذف"
                      >
                        <Trash2 className="w-5 h-5 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
