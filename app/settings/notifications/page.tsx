'use client';

import { useState, useEffect } from 'react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getCurrentSubscription,
  sendLocalNotification,
  playNotificationSound,
  showToast,
  setupNotificationServiceWorker,
} from '@/lib/notifications';

interface NotificationSettings {
  enabled: boolean;
  orders: boolean;
  messages: boolean;
  reviews: boolean;
  promotions: boolean;
  lowStock: boolean;
  payments: boolean;
  sound: boolean;
  desktop: boolean;
}

export default function NotificationSettingsPage() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    orders: true,
    messages: true,
    reviews: true,
    promotions: false,
    lowStock: true,
    payments: true,
    sound: true,
    desktop: true,
  });

  useEffect(() => {
    checkNotificationSupport();
    loadSettings();
  }, []);

  const checkNotificationSupport = async () => {
    const isSupported = isNotificationSupported();
    setSupported(isSupported);

    if (isSupported) {
      const perm = getNotificationPermission();
      setPermission(perm);

      const subscription = await getCurrentSubscription();
      setSubscribed(!!subscription);
    }
  };

  const loadSettings = () => {
    const saved = (typeof window !== 'undefined' ? localStorage.getItem('notificationSettings') : null);
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  };

  const saveSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    (typeof window !== 'undefined' ? localStorage.setItem('notificationSettings', JSON.stringify(newSettings)) : null);
    showToast('تم حفظ الإعدادات بنجاح', 'success');
  };

  const handleEnableNotifications = async () => {
    setLoading(true);

    try {
      // Setup service worker
      await setupNotificationServiceWorker();

      // Request permission
      const perm = await requestNotificationPermission();
      setPermission(perm);

      if (perm === 'granted') {
        // Subscribe to push notifications
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
        const subscription = await subscribeToPushNotifications(vapidKey);

        if (subscription) {
          setSubscribed(true);
          saveSettings({ ...settings, enabled: true });
          
          // Send test notification
          await sendLocalNotification({
            title: '🎉 تم تفعيل الإشعارات!',
            body: 'سنرسل لك إشعارات حول طلباتك ورسائلك',
            icon: '/icons/icon-192x192.png',
          });

          showToast('تم تفعيل الإشعارات بنجاح!', 'success');
        }
      } else {
        showToast('تم رفض إذن الإشعارات', 'error');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      showToast('حدث خطأ أثناء تفعيل الإشعارات', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setLoading(true);

    try {
      const success = await unsubscribeFromPushNotifications();
      if (success) {
        setSubscribed(false);
        saveSettings({ ...settings, enabled: false });
        showToast('تم إيقاف الإشعارات', 'info');
      }
    } catch (error) {
      console.error('Error disabling notifications:', error);
      showToast('حدث خطأ أثناء إيقاف الإشعارات', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    await sendLocalNotification({
      title: '🔔 إشعار تجريبي',
      body: 'هذا إشعار تجريبي للتأكد من عمل النظام',
      icon: '/icons/icon-192x192.png',
      tag: 'test',
    });

    if (settings.sound) {
      playNotificationSound('info');
    }
  };

  const handleToggleSetting = (key: keyof NotificationSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  if (!supported) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 p-6" dir="rtl">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
            <span className="text-6xl mb-4 block">⚠️</span>
            <h2 className="text-2xl font-bold text-red-800 mb-3">الإشعارات غير مدعومة</h2>
            <p className="text-red-700">
              المتصفح الذي تستخدمه لا يدعم الإشعارات الفورية.
              <br />
              يرجى استخدام متصفح حديث مثل Chrome أو Firefox أو Edge.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 p-4 md:p-6" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <span>🔔</span> إعدادات الإشعارات
          </h1>
          <p className="text-slate-600 mt-2">إدارة تفضيلات الإشعارات والتنبيهات</p>
        </div>

        {/* Main Toggle */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">تفعيل الإشعارات الفورية</h2>
              <p className="text-purple-100">
                احصل على تحديثات فورية حول طلباتك ورسائلك
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                  permission === 'granted' ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {permission === 'granted' ? '✓ مفعّل' : '✗ غير مفعّل'}
                </div>
                {subscribed && (
                  <div className="px-3 py-1 rounded-full text-sm font-bold bg-white/20">
                    مشترك في الإشعارات
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={subscribed ? handleDisableNotifications : handleEnableNotifications}
              disabled={loading}
              className="bg-white text-purple-600 px-8 py-4 rounded-xl font-bold hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              ) : subscribed ? (
                'إيقاف'
              ) : (
                'تفعيل'
              )}
            </button>
          </div>
        </div>

        {/* Notification Types */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4">أنواع الإشعارات</h3>
          <div className="space-y-4">
            {[
              { key: 'orders', icon: '🛒', label: 'الطلبات', desc: 'تحديثات حول طلباتك الجديدة والحالية' },
              { key: 'messages', icon: '💬', label: 'الرسائل', desc: 'رسائل جديدة من العملاء والبائعين' },
              { key: 'reviews', icon: '⭐', label: 'التقييمات', desc: 'تقييمات ومراجعات جديدة على منتجاتك' },
              { key: 'lowStock', icon: '📦', label: 'المخزون المنخفض', desc: 'تنبيهات عندما يقترب المنتج من النفاد' },
              { key: 'payments', icon: '💰', label: 'المدفوعات', desc: 'إشعارات بالتحويلات والدفعات المالية' },
              { key: 'promotions', icon: '🎁', label: 'العروض والخصومات', desc: 'عروض خاصة وكوبونات حصرية' },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-3xl">{item.icon}</span>
                  <div>
                    <p className="font-bold text-slate-800">{item.label}</p>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleSetting(item.key as keyof NotificationSettings)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    settings[item.key as keyof NotificationSettings]
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                      : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-transform ${
                      settings[item.key as keyof NotificationSettings]
                        ? 'translate-x-[-2rem]'
                        : 'translate-x-[-0.5rem]'
                    }`}
                  ></div>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Settings */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4">إعدادات إضافية</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-4">
                <span className="text-3xl">🔊</span>
                <div>
                  <p className="font-bold text-slate-800">الأصوات</p>
                  <p className="text-sm text-slate-500">تشغيل صوت مع الإشعارات</p>
                </div>
              </div>
              <button
                onClick={() => handleToggleSetting('sound')}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  settings.sound
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600'
                    : 'bg-slate-300'
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-transform ${
                    settings.sound ? 'translate-x-[-2rem]' : 'translate-x-[-0.5rem]'
                  }`}
                ></div>
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-4">
                <span className="text-3xl">💻</span>
                <div>
                  <p className="font-bold text-slate-800">إشعارات سطح المكتب</p>
                  <p className="text-sm text-slate-500">عرض الإشعارات حتى عند إغلاق المتصفح</p>
                </div>
              </div>
              <button
                onClick={() => handleToggleSetting('desktop')}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  settings.desktop
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600'
                    : 'bg-slate-300'
                }`}
              >
                <div
                  className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-transform ${
                    settings.desktop ? 'translate-x-[-2rem]' : 'translate-x-[-0.5rem]'
                  }`}
                ></div>
              </button>
            </div>
          </div>
        </div>

        {/* Test Notification */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">اختبر الإشعارات</h3>
              <p className="text-sm text-slate-600">تأكد من أن الإشعارات تعمل بشكل صحيح</p>
            </div>
            <button
              onClick={handleTestNotification}
              disabled={!subscribed}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إرسال إشعار تجريبي
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

