/**
 * Web Push Notifications System
 * نظام الإشعارات الفورية للمتصفح
 */

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: { [key: string]: unknown };
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * التحقق من دعم المتصفح للإشعارات
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * الحصول على حالة إذن الإشعارات
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * طلب إذن الإشعارات
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    console.error('Notifications not supported');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * إرسال إشعار محلي
 */
export async function sendLocalNotification(payload: NotificationPayload): Promise<void> {
  if (!isNotificationSupported()) {
    console.error('Notifications not supported');
    return;
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    interface NotificationOptions {
      body: string;
      icon: string;
      badge: string;
      tag: string;
      data?: { [key: string]: unknown };
      vibrate: number[];
      requireInteraction: boolean;
      actions?: Array<{
        action: string;
        title: string;
        icon?: string;
      }>;
    }
    
    const options: NotificationOptions = {
      body: payload.body,
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/badge-72x72.png',
      tag: payload.tag || 'default',
      data: payload.data,
      vibrate: [200, 100, 200],
      requireInteraction: false,
    };
    
    if (payload.actions) {
      options.actions = payload.actions;
    }
    
    await registration.showNotification(payload.title, options);
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

/**
 * الاشتراك في Push Notifications
 */
export async function subscribeToPushNotifications(
  vapidPublicKey: string
): Promise<PushSubscription | null> {
  if (!isNotificationSupported()) {
    console.error('Push notifications not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    });

    return subscription;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return null;
  }
}

/**
 * إلغاء الاشتراك في Push Notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
}

/**
 * الحصول على الاشتراك الحالي
 */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('Error getting current subscription:', error);
    return null;
  }
}

/**
 * Helper function: Convert VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * إرسال بيانات الاشتراك إلى الخادم
 */
export async function savePushSubscription(
  subscription: PushSubscription,
  userId: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription,
        userId,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return false;
  }
}

/**
 * إشعارات محددة مسبقاً للأحداث المختلفة
 */
export const NotificationTemplates = {
  newOrder: (orderNumber: string): NotificationPayload => ({
    title: '🛒 طلب جديد!',
    body: `لديك طلب جديد رقم #${orderNumber}`,
    icon: '/icons/order.png',
    tag: 'new-order',
    data: { type: 'order', orderNumber },
    actions: [
      { action: 'view', title: 'عرض الطلب' },
      { action: 'close', title: 'إغلاق' },
    ],
  }),

  orderStatusUpdate: (orderNumber: string, status: string): NotificationPayload => ({
    title: '📦 تحديث حالة الطلب',
    body: `تم تحديث حالة الطلب #${orderNumber} إلى: ${status}`,
    icon: '/icons/status.png',
    tag: `order-${orderNumber}`,
    data: { type: 'status-update', orderNumber, status },
  }),

  newMessage: (senderName: string): NotificationPayload => ({
    title: '💬 رسالة جديدة',
    body: `لديك رسالة جديدة من ${senderName}`,
    icon: '/icons/message.png',
    tag: 'new-message',
    data: { type: 'message', sender: senderName },
    actions: [
      { action: 'reply', title: 'الرد' },
      { action: 'close', title: 'إغلاق' },
    ],
  }),

  lowStock: (productName: string, quantity: number): NotificationPayload => ({
    title: '⚠️ تحذير: مخزون منخفض',
    body: `المنتج "${productName}" قارب على النفاد (${quantity} متبقي)`,
    icon: '/icons/warning.png',
    tag: 'low-stock',
    data: { type: 'low-stock', productName, quantity },
    actions: [
      { action: 'restock', title: 'إعادة التخزين' },
      { action: 'close', title: 'إغلاق' },
    ],
  }),

  payoutReceived: (amount: number): NotificationPayload => ({
    title: '💰 تم استلام دفعة',
    body: `تم تحويل ${amount} دينار إلى حسابك`,
    icon: '/icons/money.png',
    tag: 'payout',
    data: { type: 'payout', amount },
  }),

  newReview: (productName: string, rating: number): NotificationPayload => ({
    title: '⭐ تقييم جديد',
    body: `حصل منتجك "${productName}" على تقييم ${rating} نجوم`,
    icon: '/icons/star.png',
    tag: 'new-review',
    data: { type: 'review', productName, rating },
  }),

  disputeOpened: (orderNumber: string): NotificationPayload => ({
    title: '⚖️ نزاع جديد',
    body: `تم فتح نزاع على الطلب #${orderNumber}`,
    icon: '/icons/dispute.png',
    tag: 'dispute',
    data: { type: 'dispute', orderNumber },
    actions: [
      { action: 'view', title: 'عرض النزاع' },
      { action: 'close', title: 'إغلاق' },
    ],
  }),

  deliveryNearby: (orderNumber: string, minutes: number): NotificationPayload => ({
    title: '🚚 المندوب في الطريق!',
    body: `المندوب سيصل خلال ${minutes} دقيقة لتسليم طلبك #${orderNumber}`,
    icon: '/icons/delivery.png',
    tag: `delivery-${orderNumber}`,
    data: { type: 'delivery', orderNumber, eta: minutes },
    actions: [
      { action: 'track', title: 'تتبع الطلب' },
      { action: 'close', title: 'إغلاق' },
    ],
  }),
};

/**
 * إرسال إشعار بالصوت
 */
export function playNotificationSound(type: 'success' | 'info' | 'warning' | 'error' = 'info'): void {
  const audio = new Audio(`/sounds/notification-${type}.mp3`);
  audio.volume = 0.5;
  audio.play().catch((error) => {
    console.error('Error playing notification sound:', error);
  });
}

/**
 * عرض إشعار داخل التطبيق (Toast)
 */
export function showToast(
  message: string,
  type: 'success' | 'info' | 'warning' | 'error' = 'info',
  duration: number = 3000
): void {
  // هذه الدالة ستستخدم مكتبة toast مثل react-hot-toast أو sonner
  // يمكنك تخصيصها حسب احتياجك
  const colors = {
    success: 'bg-green-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  };

  const icons = {
    success: '✓',
    info: 'ℹ',
    warning: '⚠',
    error: '✗',
  };

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-6 py-4 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-slide-up`;
  toast.innerHTML = `
    <span class="text-2xl">${icons[type]}</span>
    <span class="font-medium">${message}</span>
  `;

  document.body.appendChild(toast);

  // Remove after duration
  setTimeout(() => {
    toast.classList.add('animate-slide-down');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, duration);
}

/**
 * إعداد Service Worker للإشعارات
 */
export async function setupNotificationServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    console.error('Service Worker not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    return true;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return false;
  }
}

/**
 * دالة مساعدة لمعالجة النقر على الإشعار
 */
export function handleNotificationClick(notification: Notification, action?: string): void {
  const data = notification.data;

  if (!data) return;

  switch (data.type) {
    case 'order':
      (typeof window !== 'undefined' ? window.location.href : undefined) = `/orders/${data.orderNumber}`;
      break;
    case 'message':
      (typeof window !== 'undefined' ? window.location.href : undefined) = '/chats';
      break;
    case 'payout':
      (typeof window !== 'undefined' ? window.location.href : undefined) = '/dashboard/vendor/wallet';
      break;
    case 'dispute':
      (typeof window !== 'undefined' ? window.location.href : undefined) = '/dashboard/admin/disputes';
      break;
    case 'delivery':
      (typeof window !== 'undefined' ? window.location.href : undefined) = `/orders/${data.orderNumber}`;
      break;
    default:
      (typeof window !== 'undefined' ? window.location.href : undefined) = '/dashboard';
  }

  notification.close();
}
