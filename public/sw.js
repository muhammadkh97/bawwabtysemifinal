// Service Worker for Push Notifications
// بوابتي - خدمة الإشعارات الفورية

const CACHE_NAME = 'bawabty-v1';
const urlsToCache = [
  '/',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event (offline support)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
      });
    })
  );
});

// Push event (receive notifications)
self.addEventListener('push', (event) => {

  let notificationData = {
    title: 'بوابتي',
    body: 'لديك إشعار جديد',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'default',
    data: {},
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      vibrate: [200, 100, 200],
      requireInteraction: false,
      actions: notificationData.actions || [],
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {

  event.notification.close();

  const data = event.notification.data;
  let urlToOpen = '/dashboard';

  // Handle different notification types
  if (data && data.type) {
    switch (data.type) {
      case 'order':
        urlToOpen = `/orders/${data.orderNumber}`;
        break;
      case 'status-update':
        urlToOpen = `/orders/${data.orderNumber}`;
        break;
      case 'message':
        urlToOpen = '/chats';
        break;
      case 'payout':
        urlToOpen = '/dashboard/vendor/wallet';
        break;
      case 'dispute':
        urlToOpen = '/dashboard/admin/disputes';
        break;
      case 'delivery':
        urlToOpen = `/orders/${data.orderNumber}`;
        break;
      case 'low-stock':
        urlToOpen = '/dashboard/vendor/products';
        break;
      case 'review':
        urlToOpen = '/dashboard/vendor/products';
        break;
      default:
        urlToOpen = '/dashboard';
    }
  }

  // Handle action buttons
  if (event.action) {
    switch (event.action) {
      case 'view':
        // Already handled by urlToOpen
        break;
      case 'reply':
        urlToOpen = '/chats';
        break;
      case 'track':
        urlToOpen = `/orders/${data.orderNumber}`;
        break;
      case 'restock':
        urlToOpen = '/dashboard/vendor/products';
        break;
      case 'close':
        return; // Just close the notification
      default:
        break;
    }
  }

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (let client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync (for offline actions)
self.addEventListener('sync', (event) => {

  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

async function syncOrders() {
  // Sync logic here
  // You can implement offline order submission here
}

// Periodic sync (for checking new notifications)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkForNewNotifications());
  }
});

async function checkForNewNotifications() {
  try {
    const response = await fetch('/api/notifications/check', {
      credentials: 'include',
    });
    
    if (response.ok) {
      const notifications = await response.json();
      
      for (const notification of notifications) {
        await self.registration.showNotification(notification.title, {
          body: notification.body,
          icon: notification.icon || '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          tag: notification.tag,
          data: notification.data,
        });
      }
    }
  } catch (error) {
    console.error('Error checking notifications:', error);
  }
}

// Handle messages from the app
self.addEventListener('message', (event) => {

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, options);
  }

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
