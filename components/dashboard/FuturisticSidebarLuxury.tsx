'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission, hasAnyPermission } from '@/lib/permissions';
import { getDashboardTheme, DashboardRole } from '@/lib/dashboardThemes';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Settings,
  Bell,
  FileText,
  TrendingUp,
  Shield,
  MessageSquare,
  MapPin,
  Wallet,
  Tag,
  BarChart3,
  Home,
  LogOut,
  Star,
  Megaphone,
  Store,
  Menu,
  X,
  Truck,
  Gift
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  requiredPermission?: string;
}

interface FuturisticSidebarLuxuryProps {
  role: DashboardRole;
}

export default function FuturisticSidebarLuxury({ role }: FuturisticSidebarLuxuryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [adminBadges, setAdminBadges] = useState({
    approvals: 0,
    tickets: 0,
    disputes: 0,
  });
  const [driverAvailableOrders, setDriverAvailableOrders] = useState(0);
  
  const pathname = usePathname();
  const router = useRouter();
  const { userId, isVendorStaff, isRestaurantStaff, staffPermissions } = useAuth();
  const theme = getDashboardTheme(role);

  useEffect(() => {
    if (userId) {
      if (role === 'vendor') {
        fetchCounts();
      } else if (role === 'admin') {
        fetchAdminNotifications();
      } else if (role === 'driver') {
        fetchDriverNotifications();
      }
    }
  }, [userId, role]);

  const fetchCounts = async () => {
    try {
      const { data: storeData } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!storeData) return;

      const { count: notifCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      setNotificationCount(notifCount || 0);

      const { data: orderItemsData } = await supabase
        .from('order_items')
        .select('order_id')
        .eq('vendor_id', storeData.id);

      const uniqueOrderIds = Array.from(new Set(orderItemsData?.map(item => item.order_id) || []));

      if (uniqueOrderIds.length > 0) {
        const { count: ordersCountData } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .in('id', uniqueOrderIds)
          .in('status', ['pending', 'processing']);

        setOrdersCount(ordersCountData || 0);
      }
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  const fetchAdminNotifications = async () => {
    try {
      let approvals = 0;
      
      const { count: pendingProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      approvals += pendingProducts || 0;

      const { count: pendingVendors } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'pending');
      approvals += pendingVendors || 0;

      try {
        const { count: pendingDrivers } = await supabase
          .from('drivers')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        approvals += pendingDrivers || 0;
      } catch (error) {
      }

      let disputes = 0;
      try {
        const { count: openDisputes } = await supabase
          .from('disputes')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'open');
        disputes = openDisputes || 0;
      } catch (error) {
      }

      const { count: openTickets } = await supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      setAdminBadges({
        approvals,
        disputes,
        tickets: openTickets || 0,
      });
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
    }
  };

  const fetchDriverNotifications = async () => {
    try {
      const { count: availableOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ready_for_pickup')
        .is('driver_id', null);

      setDriverAvailableOrders(availableOrders || 0);
    } catch (error) {
      console.error('Error fetching driver notifications:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/auth/login');
      router.refresh();
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
    }
  };

  const getNavItems = (): NavItem[] => {
    switch (role) {
      case 'admin':
        return [
          { name: 'لوحة التحكم', href: '/dashboard/admin', icon: LayoutDashboard },
          { name: 'الموافقات', href: '/dashboard/admin/approvals', icon: Shield, badge: adminBadges.approvals },
          { name: 'المستخدمين', href: '/dashboard/admin/users', icon: Users },
          { name: 'بكجات التوصيل', href: '/dashboard/admin/delivery-packages', icon: Package },
          { name: 'إدارة الصفحات', href: '/dashboard/admin/pages-management', icon: FileText },
          { name: 'التصنيفات', href: '/dashboard/admin/categories', icon: Tag },
          { name: 'نظام نقاط الولاء', href: '/dashboard/admin/loyalty', icon: Star },
          { name: 'صناديق الحظ', href: '/dashboard/admin/lucky-boxes', icon: Gift },
          { name: 'التذاكر', href: '/dashboard/admin/tickets', icon: MessageSquare, badge: adminBadges.tickets },
          { name: 'النزاعات', href: '/dashboard/admin/disputes', icon: MessageSquare, badge: adminBadges.disputes },
          { name: 'الماليات', href: '/dashboard/admin/financials', icon: DollarSign },
          { name: 'إعدادات الشحن', href: '/dashboard/admin/shipping-settings', icon: Truck },
          { name: 'التقارير', href: '/dashboard/admin/reports', icon: FileText },
          { name: 'الإحصائيات', href: '/dashboard/admin/analytics', icon: TrendingUp },
        ];
      case 'vendor':
        return [
          { name: 'لوحة التحكم', href: '/dashboard/vendor', icon: LayoutDashboard },
          { name: 'المنتجات', href: '/dashboard/vendor/products', icon: Package, requiredPermission: 'manage_products' },
          { name: 'الطلبات', href: '/dashboard/vendor/orders', icon: ShoppingCart, badge: ordersCount, requiredPermission: 'view_orders' },
          { name: 'الإحصائيات', href: '/dashboard/vendor/analytics', icon: BarChart3, requiredPermission: 'view_analytics' },
          { name: 'المحفظة', href: '/dashboard/vendor/wallet', icon: Wallet },
          { name: 'التقييمات', href: '/dashboard/vendor/reviews', icon: Star },
          { name: 'الترويج والكوبونات', href: '/dashboard/vendor/promotions', icon: Tag, requiredPermission: 'manage_marketing' },
          { name: 'الرسائل', href: '/dashboard/vendor/messages', icon: MessageSquare, badge: notificationCount },
          { name: 'الحسابات المساعدة', href: '/dashboard/vendor/staff', icon: Users, requiredPermission: 'manage_staff' },
          { name: 'متجري', href: '/dashboard/vendor/my-store', icon: Store },
          { name: 'الإعدادات', href: '/dashboard/vendor/settings', icon: Settings, requiredPermission: 'manage_settings' },
        ];
      case 'driver':
        return [
          { name: 'لوحة التحكم', href: '/dashboard/driver', icon: LayoutDashboard },
          { name: 'خريطة الطلبات', href: '/dashboard/driver/orders-map', icon: MapPin },
          { name: 'الطلبات المتاحة', href: '/dashboard/driver/available', icon: ShoppingCart, badge: driverAvailableOrders },
          { name: 'طلباتي', href: '/dashboard/driver/my-orders', icon: Package },
          { name: 'الموقع الحالي', href: '/dashboard/driver/location', icon: MapPin },
          { name: 'الأرباح', href: '/dashboard/driver/wallet', icon: DollarSign },
        ];
      case 'restaurant':
        return [
          { name: 'لوحة التحكم', href: '/dashboard/restaurant', icon: LayoutDashboard },
          { name: 'قائمة الطعام', href: '/dashboard/restaurant/products', icon: Package },
          { name: 'الطلبات', href: '/dashboard/restaurant/orders', icon: ShoppingCart, badge: ordersCount },
          { name: 'الإحصائيات', href: '/dashboard/restaurant/analytics', icon: BarChart3 },
          { name: 'المحفظة', href: '/dashboard/restaurant/wallet', icon: Wallet },
          { name: 'التقييمات', href: '/dashboard/restaurant/reviews', icon: Star },
          { name: 'العروض والكوبونات', href: '/dashboard/restaurant/promotions', icon: Tag },
          { name: 'الرسائل', href: '/dashboard/restaurant/messages', icon: MessageSquare, badge: notificationCount },
          { name: 'الحسابات المساعدة', href: '/dashboard/restaurant/staff', icon: Users, requiredPermission: 'manage_staff' },
          { name: 'مطعمي', href: '/dashboard/restaurant/settings', icon: Store },
        ];
      default:
        return [];
    }
  };

  const allNavItems = getNavItems();
  const navItems = allNavItems.filter(item => {
    if (role === 'vendor' && !isVendorStaff) return true;
    if (role === 'restaurant' && !isRestaurantStaff) return true;
    if (!item.requiredPermission) return true;
    if (role === 'vendor' && isVendorStaff) {
      return hasPermission(staffPermissions, item.requiredPermission);
    }
    if (role === 'restaurant' && isRestaurantStaff) {
      return hasPermission(staffPermissions, item.requiredPermission);
    }
    return true;
  });

  const isActive = (href: string) => {
    if (href === '/dashboard/admin' || href === '/dashboard/vendor' || href === '/dashboard/driver' || href === '/dashboard/restaurant') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed bottom-6 right-6 md:hidden z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${theme.primary.main}, ${theme.primary.dark})`,
          boxShadow: `0 0 30px ${theme.glow.primary}`,
        }}
      >
        {isMobileOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Menu className="w-6 h-6 text-white" />
        )}
      </motion.button>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isMobileOpen ? 0 : 280,
        }}
        transition={{ duration: 0.3 }}
        className={`fixed right-0 top-0 h-screen w-[280px] z-40 md:z-30 flex flex-col overflow-hidden ${theme.colors.background} border-l ${theme.colors.border}`}
        style={{
          boxShadow: `inset 0 0 40px ${theme.glow.secondary}`,
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{
                background: `linear-gradient(135deg, ${theme.primary.main}, ${theme.primary.dark})`,
                boxShadow: `0 0 20px ${theme.glow.primary}`,
              }}
            >
              {theme.emoji}
            </div>
            <div>
              <h2 className={`text-lg font-bold ${theme.colors.text}`}>{theme.title}</h2>
              <p className={`text-xs ${theme.colors.textSecondary}`}>بوابتي</p>
            </div>
          </motion.div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={item.href}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    className={`relative p-3 rounded-xl transition-all duration-200 flex items-center gap-3 group cursor-pointer ${
                      active
                        ? `bg-gradient-to-r ${theme.gradient.primary} text-white`
                        : `${theme.colors.text} hover:bg-white/5`
                    }`}
                    style={
                      active
                        ? {
                            boxShadow: `0 0 20px ${theme.glow.primary}`,
                          }
                        : {}
                    }
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium flex-1">{item.name}</span>
                    {item.badge && item.badge > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="px-2 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 group-hover:bg-red-500/30"
                      >
                        {item.badge}
                      </motion.span>
                    )}
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${theme.colors.text} hover:bg-red-500/10 border border-red-500/20`}
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">تسجيل الخروج</span>
          </motion.button>
        </div>
      </motion.aside>
    </>
  );
}
