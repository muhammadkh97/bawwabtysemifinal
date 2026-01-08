'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission, hasAnyPermission } from '@/lib/permissions';
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
  requiredPermission?: string; // الصلاحية المطلوبة لعرض هذا العنصر
}

interface FuturisticSidebarProps {
  role: 'admin' | 'vendor' | 'driver' | 'restaurant';
}

export default function FuturisticSidebar({ role }: FuturisticSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  
  // إشعارات الأدمن
  const [adminBadges, setAdminBadges] = useState({
    approvals: 0,
    tickets: 0,
    disputes: 0,
  });
  
  // إشعارات السائق
  const [driverAvailableOrders, setDriverAvailableOrders] = useState(0);
  
  const pathname = usePathname();
  const router = useRouter();
  const { userId, isVendorStaff, isRestaurantStaff, staffPermissions } = useAuth();

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
      // Get store ID (vendor_id)
      const { data: storeData } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!storeData) return;

      // Get unread notifications count
      const { count: notifCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      setNotificationCount(notifCount || 0);

      // Get pending orders count
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
      // جلب عدد الموافقات المعلقة
      let approvals = 0;
      
      // المنتجات المعلقة
      const { count: pendingProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      approvals += pendingProducts || 0;

      // البائعون المعلقون
      const { count: pendingVendors } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'pending');
      approvals += pendingVendors || 0;

      // المناديب المعلقون (مع try-catch)
      try {
        const { count: pendingDrivers } = await supabase
          .from('drivers')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        approvals += pendingDrivers || 0;
      } catch (error) {
      }

      // جلب النزاعات المفتوحة
      let disputes = 0;
      try {
        const { count: openDisputes } = await supabase
          .from('disputes')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'open');
        disputes = openDisputes || 0;
      } catch (error) {
      }

      // جلب التذاكر المفتوحة
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
      // جلب الطلبات المتاحة للسائقين (ready_for_pickup and not assigned)
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

  // تحديد عناصر القائمة حسب الدور
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
  
  // فلترة العناصر حسب صلاحيات المساعد
  const navItems = allNavItems.filter(item => {
    // إذا لم يكن مساعد، أظهر كل العناصر
    if (role === 'vendor' && !isVendorStaff) return true;
    if (role === 'restaurant' && !isRestaurantStaff) return true;
    
    // إذا كان مساعد ولكن العنصر لا يحتاج صلاحية، أظهره
    if (!item.requiredPermission) return true;
    
    // إذا كان مساعد بائع، تحقق من صلاحياته
    if (role === 'vendor' && isVendorStaff) {
      return hasPermission(staffPermissions, item.requiredPermission as any);
    }
    
    // إذا كان مساعد مطعم، تحقق من صلاحياته
    if (role === 'restaurant' && isRestaurantStaff) {
      return hasPermission(staffPermissions, item.requiredPermission as any);
    }
    
    return true;
  });

  const isActive = (href: string) => pathname === href;

  // إغلاق القائمة عند الانتقال لصفحة جديدة
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* زر Hamburger للموبايل */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed bottom-6 left-4 z-[60] p-3 rounded-xl bg-gradient-to-br from-[#6236FF] to-[#FF219D] shadow-xl md:hidden"
        aria-label="فتح القائمة"
      >
        <motion.div
          animate={{ rotate: isMobileOpen ? 90 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isMobileOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </motion.div>
      </button>

      {/* Backdrop للموبايل */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={{ width: '70px' }}
        animate={{ 
          width: (isExpanded || isMobileOpen) ? '280px' : '70px',
        }}
        className={`fixed right-0 top-0 h-screen z-50 overflow-hidden transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
        onMouseEnter={() => !isMobileOpen && setIsExpanded(true)}
        onMouseLeave={() => !isMobileOpen && setIsExpanded(false)}
        style={{
          background: 'rgba(15, 10, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(98, 54, 255, 0.2)',
          boxShadow: '-10px 0 50px rgba(98, 54, 255, 0.15)',
        }}
      >
      {/* Logo */}
      <div className="flex items-center justify-center h-14 sm:h-16 md:h-20 border-b border-purple-500/20">
        <motion.div
          animate={{ scale: (isExpanded || isMobileOpen) ? 1 : 0.8 }}
          className="relative"
        >
          {(isExpanded || isMobileOpen) ? (
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#6236FF] via-[#B621FE] to-[#FF219D] bg-clip-text text-transparent">
              بوابتي
            </h1>
          ) : (
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#6236FF] to-[#FF219D] flex items-center justify-center">
              <span className="text-white font-bold text-lg sm:text-xl">ب</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Navigation Items */}
      <nav className="py-4 sm:py-6 px-2 overflow-y-auto h-[calc(100vh-180px)] sm:h-[calc(100vh-200px)] scrollbar-hide">
        <ul className="space-y-1.5 sm:space-y-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <motion.li
                key={item.href}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={item.href}>
                  <div
                    className={`relative flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl transition-all duration-300 group ${
                      active
                        ? 'bg-gradient-to-r from-[#6236FF] to-[#FF219D] shadow-lg shadow-purple-500/50'
                        : 'hover:bg-white/5'
                    }`}
                    style={
                      active
                        ? {
                            boxShadow: '0 0 30px rgba(98, 54, 255, 0.5), 0 0 60px rgba(255, 33, 157, 0.3)',
                          }
                        : {}
                    }
                  >
                    {/* Icon */}
                    <div className="relative flex-shrink-0">
                      <Icon
                        className={`w-5 h-5 sm:w-6 sm:h-6 ${
                          active ? 'text-white' : 'text-purple-300 group-hover:text-white'
                        } transition-colors`}
                      />
                      
                      {/* Glow effect */}
                      {active && (
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          animate={{
                            boxShadow: [
                              '0 0 10px rgba(255, 255, 255, 0.5)',
                              '0 0 20px rgba(255, 255, 255, 0.3)',
                              '0 0 10px rgba(255, 255, 255, 0.5)',
                            ],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </div>

                    {/* Text */}
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: (isExpanded || isMobileOpen) ? 1 : 0 }}
                      className={`text-xs sm:text-sm font-medium whitespace-nowrap ${
                        active ? 'text-white' : 'text-purple-200 group-hover:text-white'
                      }`}
                    >
                      {item.name}
                    </motion.span>

                    {/* Badge - يظهر دائماً عند وجود إشعارات */}
                    {item.badge && item.badge > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`${(isExpanded || isMobileOpen) ? 'mr-auto' : 'absolute top-1 left-1'} px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-rose-500 rounded-full min-w-[18px] sm:min-w-[20px] text-center`}
                      >
                        {item.badge}
                      </motion.span>
                    )}

                    {/* Active indicator */}
                    {active && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 w-1 h-6 sm:h-8 bg-gradient-to-b from-[#6236FF] to-[#FF219D] rounded-r-full"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </div>
                </Link>
              </motion.li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Actions */}
      <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 px-2 space-y-2">
        {/* Logout */}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl hover:bg-red-500/10 transition-colors group"
        >
          <LogOut className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 group-hover:text-red-300 transition-colors" />
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: (isExpanded || isMobileOpen) ? 1 : 0 }}
            className="text-xs sm:text-sm font-medium text-red-400 group-hover:text-red-300 whitespace-nowrap"
          >
            تسجيل الخروج
          </motion.span>
        </button>
      </div>

      {/* Decorative gradient line */}
      <div
        className="absolute top-0 left-0 w-full h-0.5 sm:h-1"
        style={{
          background: 'linear-gradient(90deg, #6236FF 0%, #B621FE 50%, #FF219D 100%)',
        }}
      />
    </motion.aside>
    </>
  );
}

