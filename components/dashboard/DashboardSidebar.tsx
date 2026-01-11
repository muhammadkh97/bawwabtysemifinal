'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth';
import { UserRole } from '@/types';
import { logger } from '@/lib/logger';

interface SidebarItem {
  label: string;
  href: string;
  icon: string;
  roles: UserRole[];
}

const sidebarItems: SidebarItem[] = [
  // Admin Links
  { label: 'لوحة التحكم', href: '/dashboard/admin', icon: '📊', roles: ['admin'] },
  { label: 'الموافقات', href: '/dashboard/admin/approvals', icon: '✅', roles: ['admin'] },
  { label: 'البائعين', href: '/dashboard/admin/vendors', icon: '🏪', roles: ['admin'] },
  { label: 'المناديب', href: '/dashboard/admin/drivers', icon: '🚗', roles: ['admin'] },
  { label: 'العملاء', href: '/dashboard/admin/customers', icon: '👥', roles: ['admin'] },
  { label: 'المنتجات', href: '/dashboard/admin/products', icon: '📦', roles: ['admin'] },
  { label: 'الطلبات', href: '/dashboard/admin/orders', icon: '🛒', roles: ['admin'] },
  { label: 'المالية', href: '/dashboard/admin/financials', icon: '💰', roles: ['admin'] },
  { label: 'التذاكر', href: '/dashboard/admin/tickets', icon: '🎫', roles: ['admin'] },
  { label: 'النزاعات', href: '/dashboard/admin/disputes', icon: '⚖️', roles: ['admin'] },
  { label: 'الإعدادات', href: '/dashboard/admin/settings', icon: '⚙️', roles: ['admin'] },
  
  // Vendor Links
  { label: 'لوحة التحكم', href: '/dashboard/vendor', icon: '📊', roles: ['vendor'] },
  { label: 'منتجاتي', href: '/dashboard/vendor/products', icon: '📦', roles: ['vendor'] },
  { label: 'الطلبات', href: '/dashboard/vendor/orders', icon: '🛒', roles: ['vendor'] },
  { label: 'المحفظة', href: '/dashboard/vendor/wallet', icon: '💰', roles: ['vendor'] },
  { label: 'التقييمات', href: '/dashboard/vendor/reviews', icon: '⭐', roles: ['vendor'] },
  { label: 'الكوبونات', href: '/dashboard/vendor/coupons', icon: '🎟️', roles: ['vendor'] },
  { label: 'الإحصائيات', href: '/dashboard/vendor/analytics', icon: '📈', roles: ['vendor'] },
  { label: 'الرسائل', href: '/dashboard/vendor/messages', icon: '💬', roles: ['vendor'] },
  { label: 'إعدادات المتجر', href: '/dashboard/vendor/settings', icon: '⚙️', roles: ['vendor'] },
  
  // Driver Links
  { label: 'لوحة التحكم', href: '/dashboard/driver', icon: '📊', roles: ['driver'] },
  { label: 'التوصيلات المتاحة', href: '/dashboard/driver/available', icon: '📍', roles: ['driver'] },
  { label: 'توصيلاتي', href: '/dashboard/driver/deliveries', icon: '🚚', roles: ['driver'] },
  { label: 'المحفظة', href: '/dashboard/driver/wallet', icon: '💰', roles: ['driver'] },
  { label: 'الإحصائيات', href: '/dashboard/driver/analytics', icon: '📈', roles: ['driver'] },
  { label: 'الإعدادات', href: '/dashboard/driver/settings', icon: '⚙️', roles: ['driver'] },
];

export default function DashboardSidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/auth/login');
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'خطأ في تسجيل الخروج'
      
      logger.error('handleLogout failed', {
        error: errorMessage,
        component: 'DashboardSidebar',
        role,
      })
    }
  };
  
  const filteredItems = sidebarItems.filter(item => item.roles.includes(role));

  return (
    <aside className="w-64 bg-white border-l border-gray-200 min-h-screen sticky top-0 right-0">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-8">
          {role === 'admin' && 'إدارة المنصة'}
          {role === 'vendor' && 'لوحة البائع'}
          {role === 'driver' && 'لوحة المندوب'}
        </h2>
        
        <nav className="space-y-2">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="absolute bottom-0 w-full p-6 border-t border-gray-200">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all"
        >
          <span className="text-xl">🚪</span>
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}

