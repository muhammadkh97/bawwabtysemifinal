/**
 * Notification Utilities
 * Handle notification CRUD operations and real-time subscriptions
 */

import { supabase } from './supabase'
import { logger } from '@/lib/logger'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  link?: string
  data?: Record<string, any>  // تم تغيير metadata إلى data (يطابق قاعدة البيانات)
  priority?: 'low' | 'normal' | 'high' | 'urgent'  // جديد
  category?: 'orders' | 'products' | 'messages' | 'system' | 'staff' | 'admin'  // جديد
  is_read: boolean
  created_at: string
  read_at?: string  // جديد - تم إضافته في قاعدة البيانات
}

export type NotificationType =
  | 'new_order'
  | 'order_accepted'
  | 'order_preparing'
  | 'order_ready'
  | 'order_picked_up'
  | 'driver_nearby'
  | 'order_delivered'
  | 'new_message'
  | 'vendor_pending'
  | 'driver_pending'
  | 'product_pending'
  | 'account_approved'
  | 'account_rejected'
  | 'product_approved'
  | 'product_rejected'
  | 'staff_invitation'

/**
 * Get all notifications for current user
 */
export async function getNotifications(limit = 50): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    logger.error('Error fetching notifications', { error: error.message, component: 'fetchNotifications' });
    return []
  }

  return data || []
}

/**
 * Get unread notifications count
 */
export async function getUnreadCount(): Promise<number> {
  const { data, error } = await supabase.rpc('get_unread_count')

  if (error) {
    logger.error('Error getting unread count', { error: error.message, component: 'getUnreadCount' });
    return 0
  }

  return data || 0
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<boolean> {
  const { error } = await supabase.rpc('mark_notification_read', {
    notification_uuid: notificationId,
  })

  if (error) {
    logger.error('Error marking notification as read', { error: error.message, component: 'markAsRead', notificationId });
    return false
  }

  return true
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<boolean> {
  const { error } = await supabase.rpc('mark_all_notifications_read')

  if (error) {
    logger.error('Error marking all as read', { error: error.message, component: 'markAllAsRead' });
    return false
  }

  return true
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)

  if (error) {
    logger.error('Error deleting notification', { error: error.message, component: 'deleteNotification', notificationId });
    return false
  }

  return true
}

/**
 * Create a notification (for testing or manual creation)
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
  data?: Record<string, any>,
  priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal',
  category?: 'orders' | 'products' | 'messages' | 'system' | 'staff' | 'admin'
): Promise<string | null> {
  const { data: notificationId, error } = await supabase.rpc('create_notification', {
    p_user_id: userId,
    p_type: type,
    p_title: title,
    p_message: message,
    p_link: link,
    p_metadata: data || {},
    p_priority: priority,
    p_category: category,
  })

  if (error) {
    logger.error('Error creating notification', { error: error.message, component: 'createNotification', userId, type });
    return null
  }

  return notificationId
}

/**
 * Subscribe to real-time notifications
 */
export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: Notification) => void
) {
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
        onNotification(payload.new as Notification)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    new_order: '🎉',
    order_accepted: '✅',
    order_preparing: '👨‍🍳',
    order_ready: '📦',
    order_picked_up: '🚚',
    driver_nearby: '🚚',
    order_delivered: '✨',
    new_message: '💬',
    vendor_pending: '🏪',
    driver_pending: '🚗',
    product_pending: '📦',
    account_approved: '✅',
    account_rejected: '❌',
    product_approved: '✅',
    product_rejected: '❌',
    staff_invitation: '👥',
  }

  return icons[type] || '🔔'
}

/**
 * Get notification color based on type
 */
export function getNotificationColor(type: NotificationType): string {
  if (type.includes('approved')) return 'text-green-500'
  if (type.includes('rejected')) return 'text-red-500'
  if (type.includes('pending')) return 'text-yellow-500'
  if (type.includes('message')) return 'text-blue-500'
  if (type === 'staff_invitation') return 'text-purple-500'
  return 'text-purple-500'
}

/**
 * Format notification time (relative)
 */
export function formatNotificationTime(timestamp: string): string {
  const now = new Date()
  const time = new Date(timestamp)
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)

  if (diffInSeconds < 60) return 'الآن'
  if (diffInSeconds < 3600)
    return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`
  if (diffInSeconds < 86400)
    return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`
  if (diffInSeconds < 604800)
    return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`

  return time.toLocaleDateString('ar-SA', {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Notify new chat message
 * Call this when sending a message
 */
export async function notifyNewMessage(
  recipientId: string,
  senderId: string,
  messagePreview: string
): Promise<void> {
  await supabase.rpc('notify_new_message', {
    recipient_id: recipientId,
    sender_id: senderId,
    message_preview: messagePreview,
  })
}

/**
 * Notify admin of pending vendor
 */
export async function notifyAdminVendorPending(
  vendorUserId: string
): Promise<void> {
  await supabase.rpc('notify_admin_vendor_pending', {
    vendor_user_id: vendorUserId,
  })
}

/**
 * Notify admin of pending driver
 */
export async function notifyAdminDriverPending(
  driverUserId: string
): Promise<void> {
  await supabase.rpc('notify_admin_driver_pending', {
    driver_user_id: driverUserId,
  })
}

/**
 * Notify admin of pending product
 */
export async function notifyAdminProductPending(
  productId: string
): Promise<void> {
  await supabase.rpc('notify_admin_product_pending', {
    product_uuid: productId,
  })
}

/**
 * Notify driver of nearby order
 */
export async function notifyDriverNearbyOrder(
  driverId: string,
  orderId: string
): Promise<void> {
  await supabase.rpc('notify_driver_nearby_order', {
    driver_uuid: driverId,
    order_uuid: orderId,
  })
}
