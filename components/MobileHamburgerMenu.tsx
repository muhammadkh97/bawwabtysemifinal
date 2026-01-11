'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth';
import { logger } from '@/lib/logger';

interface MenuItem {
  href: string;
  icon: string;
  label: string;
  badge?: number;
}

interface MobileMenuProps {
  userRole?: 'customer' | 'vendor' | 'driver' | 'admin';
  userName?: string;
}

export default function MobileHamburgerMenu({ userRole = 'customer', userName }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {

      // تسجيل خروج من Supabase
      await signOut();
      // إعادة التوجيه لصفحة تسجيل الدخول
      router.push('/auth/login');
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'خطأ في تسجيل الخروج'
      
      logger.error('handleLogout failed', {
        error: errorMessage,
        component: 'MobileHamburgerMenu',
        userRole,
      })
    }
  };

  // إغلاق القائمة عند تغيير الصفحة
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // منع السكرول عند فتح القائمة
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const getMenuItems = (): MenuItem[] => {
    const commonItems: MenuItem[] = [
      { href: '/', icon: '🏠', label: 'الرئيسية' },
      { href: '/products', icon: '🛍️', label: 'تصفح المنتجات' },
      { href: '/about', icon: 'ℹ️', label: 'من نحن' },
      { href: '/contact', icon: '📞', label: 'اتصل بنا' },
    ];

    switch (userRole) {
      case 'vendor':
        return [
          { href: '/dashboard/vendor', icon: '📊', label: 'لوحة التحكم' },
          { href: '/dashboard/vendor/products', icon: '📦', label: 'منتجاتي' },
          { href: '/dashboard/vendor/orders', icon: '🛒', label: 'الطلبات', badge: 3 },
          { href: '/dashboard/vendor/wallet', icon: '💰', label: 'المحفظة' },
          { href: '/dashboard/vendor/coupons', icon: '🎟️', label: 'الكوبونات' },
          { href: '/dashboard/vendor/settings', icon: '⚙️', label: 'الإعدادات' },
          { href: '/support', icon: '💬', label: 'الدعم الفني' },
        ];
      case 'driver':
        return [
          { href: '/dashboard/driver', icon: '🚗', label: 'التوصيلات' },
          { href: '/dashboard/driver/wallet', icon: '💵', label: 'أرباحي' },
          { href: '/dashboard/driver/history', icon: '📜', label: 'سجل التوصيلات' },
          { href: '/dashboard/driver/profile', icon: '👤', label: 'ملفي الشخصي' },
          { href: '/support', icon: '💬', label: 'الدعم الفني' },
        ];
      case 'admin':
        return [
          { href: '/dashboard/admin', icon: '📊', label: 'لوحة التحكم' },
          { href: '/dashboard/admin/approvals', icon: '✅', label: 'الموافقات', badge: 5 },
          { href: '/dashboard/admin/financials', icon: '💰', label: 'المالية' },
          { href: '/dashboard/admin/users', icon: '👥', label: 'المستخدمين' },
          { href: '/dashboard/admin/disputes', icon: '⚖️', label: 'النزاعات', badge: 2 },
          { href: '/dashboard/admin/support', icon: '🎫', label: 'تذاكر الدعم' },
          { href: '/dashboard/admin/settings', icon: '⚙️', label: 'إعدادات المنصة' },
        ];
      default:
        return [
          ...commonItems,
          { href: '/orders', icon: '📦', label: 'طلباتي' },
          { href: '/wishlist', icon: '❤️', label: 'المفضلة', badge: 12 },
          { href: '/chats', icon: '💬', label: 'المحادثات', badge: 2 },
          { href: '/account', icon: '👤', label: 'حسابي' },
        ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Hamburger Button - Mobile Only */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
        aria-label="Menu"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide Menu */}
      <div
        className={`md:hidden fixed top-0 right-0 h-full w-80 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full overflow-y-auto" dir="rtl">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 sticky top-0 z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">القائمة</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {userName && (
              <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                  👤
                </div>
                <div>
                  <p className="font-bold">{userName}</p>
                  <p className="text-xs opacity-90">
                    {userRole === 'vendor' && 'بائع'}
                    {userRole === 'driver' && 'مندوب توصيل'}
                    {userRole === 'admin' && 'مدير'}
                    {userRole === 'customer' && 'عميل'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105'
                      : 'bg-white text-slate-700 hover:bg-blue-50 hover:scale-105 shadow-sm'
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="flex-1 font-bold">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      isActive ? 'bg-white text-blue-600' : 'bg-red-500 text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-300 mt-auto">
            <button 
              onClick={handleLogout}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-4 px-6 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              🚪 تسجيل الخروج
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

