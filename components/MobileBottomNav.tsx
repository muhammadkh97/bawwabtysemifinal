'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface MobileNavProps {
  role: 'customer' | 'vendor' | 'driver' | 'admin';
}

export default function MobileBottomNav({ role }: MobileNavProps) {
  const pathname = usePathname();

  const getNavItems = () => {
    switch (role) {
      case 'customer':
        return [
          { href: '/', icon: '🏠', label: 'الرئيسية' },
          { href: '/products', icon: '🛍️', label: 'المتجر' },
          { href: '/orders', icon: '📦', label: 'طلباتي' },
          { href: '/wishlist', icon: '❤️', label: 'المفضلة' },
          { href: '/account', icon: '👤', label: 'حسابي' },
        ];
      case 'vendor':
        return [
          { href: '/dashboard/vendor', icon: '📊', label: 'لوحة التحكم' },
          { href: '/dashboard/vendor/products', icon: '📦', label: 'المنتجات' },
          { href: '/dashboard/vendor/orders', icon: '🛒', label: 'الطلبات' },
          { href: '/dashboard/vendor/wallet', icon: '💰', label: 'المحفظة' },
          { href: '/dashboard/vendor/settings', icon: '⚙️', label: 'الإعدادات' },
        ];
      case 'driver':
        return [
          { href: '/dashboard/driver', icon: '🚗', label: 'التوصيلات' },
          { href: '/dashboard/driver/wallet', icon: '💵', label: 'الأرباح' },
          { href: '/dashboard/driver/history', icon: '📜', label: 'السجل' },
          { href: '/dashboard/driver/profile', icon: '👤', label: 'الملف' },
        ];
      case 'admin':
        return [
          { href: '/dashboard/admin', icon: '📊', label: 'لوحة التحكم' },
          { href: '/dashboard/admin/approvals', icon: '✅', label: 'الموافقات' },
          { href: '/dashboard/admin/financials', icon: '💰', label: 'المالية' },
          { href: '/dashboard/admin/users', icon: '👥', label: 'المستخدمين' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-200 shadow-2xl z-50">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-all transform ${
                  isActive
                    ? 'text-blue-600 scale-110'
                    : 'text-slate-500 hover:text-blue-500'
                }`}
              >
                <span className={`text-2xl mb-1 ${isActive ? 'animate-bounce' : ''}`}>
                  {item.icon}
                </span>
                <span className={`text-xs font-bold ${isActive ? 'text-blue-600' : 'text-slate-600'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 w-12 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Padding للمحتوى - Mobile Only */}
      <div className="md:hidden h-16" />
    </>
  );
}

