'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react'
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

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const hasInteracted = useRef(false)
  const router = useRouter()
  const { user } = useAuth()

  // Track user interaction for sound playback
  useEffect(() => {
    const markInteraction = () => {
      hasInteracted.current = true
    }
    document.addEventListener('click', markInteraction, { once: true })
    document.addEventListener('keydown', markInteraction, { once: true })
    
    return () => {
      document.removeEventListener('click', markInteraction)
      document.removeEventListener('keydown', markInteraction)
    }
  }, [])

  // Load notifications
  useEffect(() => {
    if (user) {
      loadNotifications()
      loadUnreadCount()
    }
  }, [user])

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user) return

    const unsubscribe = subscribeToNotifications(user.id, (notification) => {
      setNotifications((prev) => [notification, ...prev])
      setUnreadCount((prev) => prev + 1)

      // Play notification sound
      playNotificationSound()

      // Show browser notification
      showBrowserNotification(notification)
    })

    return unsubscribe
  }, [user])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
      setIsOpen(false)
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
    await deleteNotification(notificationId)
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    loadUnreadCount()
  }

  const playNotificationSound = () => {
    if (!hasInteracted.current) return
    const audio = new Audio('/notification-sound.mp3')
    audio.volume = 0.5
    audio.play().catch(() => {
      // Ignore if user hasn't interacted with page yet
    })
  }

  const showBrowserNotification = (notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo.png',
        badge: '/logo.png',
      })
    }
  }

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  if (!user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative group"
      >
        <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 flex items-center justify-center transition-all duration-300 group-hover:shadow-lg group-hover:scale-105">
          <Bell className="w-4.5 h-4.5 sm:w-5 sm:h-5 md:w-5.5 md:h-5.5 text-purple-600 group-hover:text-purple-700 transition-colors" />
        </div>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] sm:min-w-[20px] h-[18px] sm:h-5 px-1 sm:px-1.5 flex items-center justify-center text-[9px] sm:text-[10px] font-black text-white bg-gradient-to-r from-red-500 to-pink-600 rounded-full animate-pulse shadow-lg border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/10 z-[60]"
            onClick={() => setIsOpen(false)}
          />
          
          <div
            className="absolute right-0 mt-3 w-[90vw] sm:w-80 md:w-96 max-h-[500px] sm:max-h-[600px] rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden z-[70] animate-in fade-in slide-in-from-top-5 duration-300"
            style={{
              background: 'linear-gradient(135deg, rgba(15, 10, 30, 0.98) 0%, rgba(30, 15, 50, 0.98) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(98, 54, 255, 0.3)',
            }}
          >
          {/* Header */}
          <div className="sticky top-0 z-10 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-white/10"
            style={{
              background: 'linear-gradient(135deg, rgba(98, 54, 255, 0.2) 0%, rgba(147, 51, 234, 0.2) 100%)',
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                🔔 الإشعارات
                {unreadCount > 0 && (
                  <span className="text-xs sm:text-sm font-normal text-purple-300">
                    ({unreadCount} جديد)
                  </span>
                )}
              </h3>

              <div className="flex items-center gap-1 sm:gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="p-1 sm:p-1.5 rounded-lg hover:bg-white/10 transition-colors group"
                    title="تحديد الكل كمقروء"
                  >
                    <CheckCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-300 group-hover:text-white" />
                  </button>
                )}

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 sm:p-1.5 rounded-lg hover:bg-white/10 transition-colors group"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-300 group-hover:text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[420px] sm:max-h-[500px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-10 sm:py-12">
                <div className="animate-spin rounded-full h-7 w-7 sm:h-8 sm:w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 sm:py-12 px-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-3 sm:mb-4">
                  <Bell className="w-7 h-7 sm:w-8 sm:h-8 text-purple-400" />
                </div>
                <p className="text-white font-medium mb-1 text-sm sm:text-base">لا توجد إشعارات</p>
                <p className="text-gray-400 text-xs sm:text-sm text-center">
                  سنقوم بإعلامك عند حدوث أي جديد
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`group p-3 sm:p-4 cursor-pointer transition-all duration-300 hover:bg-white/5 ${
                      !notification.is_read ? 'bg-purple-500/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-xl">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-white text-sm line-clamp-1">
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"></div>
                          )}
                        </div>

                        <p className="text-gray-300 text-sm mt-1 line-clamp-2">
                          {notification.message}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {formatNotificationTime(notification.created_at)}
                          </span>

                          <button
                            onClick={(e) => handleDelete(e, notification.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 transition-all"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="sticky bottom-0 px-4 py-3 border-t border-white/10 bg-gradient-to-t from-purple-900/20 to-transparent">
              <button
                onClick={() => {
                  router.push('/notifications')
                  setIsOpen(false)
                }}
                className="w-full py-2 rounded-xl text-sm font-medium text-purple-300 hover:text-white hover:bg-white/10 transition-all"
              >
                عرض جميع الإشعارات
              </button>
            </div>
          )}
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #6236ff, #9333ea);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #7c3aed, #a855f7);
        }
      `}</style>
    </div>
  )
}
