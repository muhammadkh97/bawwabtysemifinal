'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import ModernDashboardLayoutLuxury, { ModernStatCardLuxury, ModernSectionLuxury } from '@/components/dashboard/ModernDashboardLayoutLuxury';
import FuturisticSidebarLuxury from '@/components/dashboard/FuturisticSidebarLuxury';
import FuturisticNavbarLuxury from '@/components/dashboard/FuturisticNavbarLuxury';
import { 
  ShoppingBag, 
  DollarSign, 
  Package, 
  Star, 
  Clock,
  TrendingUp,
  Eye,
  EyeOff,
  Settings,
  AlertCircle,
} from 'lucide-react';

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  averageRating: number;
  todayOrders: number;
  pendingOrders: number;
}

function RestaurantDashboardContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [restaurantInfo, setRestaurantInfo] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    averageRating: 0,
    todayOrders: 0,
    pendingOrders: 0,
  });
  const [isOnline, setIsOnline] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login?redirect=/dashboard/restaurant');
        return;
      }

      setUserId(user.id);

      // جلب معلومات المطعم
      const { data: restaurantData } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .eq('business_type', 'restaurant')
        .single();

      if (restaurantData) {
        setRestaurantId(restaurantData.id);
        setRestaurantInfo(restaurantData);
        setIsOnline(restaurantData.is_online ?? true);
        
        // جلب الإحصائيات
        await fetchStats(restaurantData.id);
        await fetchRecentOrders(restaurantData.id);
      }

      setLoading(false);
    } catch (error) {
      logger.error('Error checking auth:', error);
      router.push('/auth/login');
    }
  };

  const fetchStats = async (restaurantId: string) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // إجمالي الطلبات والإيرادات
      const { data: ordersData } = await supabase
        .from('orders')
        .select('total_amount, status, created_at')
        .eq('vendor_id', restaurantId);

      const totalOrders = ordersData?.length || 0;
      const totalRevenue = ordersData?.reduce((sum: number, order: any) => sum + (Number(order.total_amount) || 0), 0) || 0;
      const todayOrders = ordersData?.filter((o: any) => new Date(o.created_at) >= today).length || 0;
      const pendingOrders = ordersData?.filter((o: any) => o.status === 'pending').length || 0;

      // عدد المنتجات
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', restaurantId);

      // متوسط التقييم
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('rating')
        .eq('vendor_id', restaurantId);

      const averageRating = reviewsData && reviewsData.length > 0
        ? reviewsData.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewsData.length
        : 0;

      setStats({
        totalOrders,
        totalRevenue,
        totalProducts: productsCount || 0,
        averageRating,
        todayOrders,
        pendingOrders,
      });
    } catch (error) {
      logger.error('Error fetching stats:', error);
    }
  };

  const fetchRecentOrders = async (restaurantId: string) => {
    try {
      const { data } = await supabase
        .from('orders')
        .select(`
          *,
          customer:users!orders_customer_id_fkey(name, phone)
        `)
        .eq('vendor_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentOrders(data || []);
    } catch (error) {
      logger.error('Error fetching recent orders:', error);
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      const newStatus = !isOnline;
      
      const { error } = await supabase
        .from('stores')
        .update({ is_online: newStatus })
        .eq('id', restaurantId);

      if (error) throw error;

      setIsOnline(newStatus);
    } catch (error) {
      logger.error('Error toggling online status:', error);
    }
  };

  const statCards = [
    {
      title: 'إجمالي الطلبات',
      value: stats.totalOrders.toString(),
      icon: ShoppingBag,
      gradient: 'from-red-500 to-orange-500',
    },
    {
      title: 'إجمالي الإيرادات',
      value: `${stats.totalRevenue.toFixed(2)} ₪`,
      icon: DollarSign,
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      title: 'عدد الوجبات',
      value: stats.totalProducts.toString(),
      icon: Package,
      gradient: 'from-orange-500 to-red-500',
    },
    {
      title: 'التقييم',
      value: stats.averageRating.toFixed(1),
      icon: Star,
      gradient: 'from-yellow-500 to-orange-500',
    },
  ];

  const quickStats = [
    { 
      label: 'طلبات اليوم', 
      value: stats.todayOrders.toString(), 
      icon: Clock, 
      color: 'from-orange-500 to-red-500' 
    },
    { 
      label: 'طلبات معلقة', 
      value: stats.pendingOrders.toString(), 
      icon: TrendingUp, 
      color: 'from-purple-500 to-pink-500' 
    },
  ];

  return (
    <ModernDashboardLayoutLuxury
      title={`مرحباً بك في ${restaurantInfo?.shop_name_ar || 'مطعمك'}! 🙴`}
      subtitle="إدارة طلباتك ووجباتك وإيراداتك"
      loading={loading}
      role="restaurant"
      headerAction={
        <button
          onClick={toggleOnlineStatus}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
            isOnline
              ? 'bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30'
              : 'bg-gray-500/20 text-gray-300 border border-gray-500/30 hover:bg-gray-500/30'
          }`}
        >
          {isOnline ? (
            <>
              <Eye className="w-4 h-4" />
              متصل
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4" />
              غير متصل
            </>
          )}
        </button>
      }
    >
      {/* Online Status Alert */}
      {!isOnline && (
        <ModernSectionLuxury
          title="تنبيه"
          subtitle="المطعم غير متصل - لن يظهر للعملاء في الصفحة الرئيسية"
          icon={AlertCircle}
          delay={0.1}
          role="restaurant"
        >
          <div></div>
        </ModernSectionLuxury>
      )}

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <ModernStatCardLuxury
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            gradient={stat.gradient}
            delay={index * 0.1}
            role="restaurant"
          />
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {quickStats.map((item, index) => (
          <ModernStatCardLuxury
            key={item.label}
            title={item.label}
            value={item.value}
            icon={item.icon}
            gradient={item.color}
            delay={0.4 + index * 0.1}
            large
            role="restaurant"
          />
        ))}
      </div>

      {/* Recent Orders */}
      <ModernSectionLuxury
        title="آخر الطلبات 📋"
        action={
          <button
            onClick={() => router.push('/dashboard/restaurant/orders')}
            className="text-orange-400 hover:text-orange-300 font-semibold text-sm transition-colors"
          >
            عرض الكل ←
          </button>
        }
        delay={0.5}
        role="restaurant"
      >
        {recentOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-orange-400/50 mx-auto mb-4" />
            <p className="text-orange-300">لا توجد طلبات حتى الآن</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 backdrop-blur-xl bg-white/5 border border-orange-500/20 rounded-xl hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold">
                    #{order.id.slice(0, 4)}
                  </div>
                  <div>
                    <p className="font-bold text-white">
                      {order.customer?.name || 'عميل'}
                    </p>
                    <p className="text-sm text-orange-200">
                      {new Date(order.created_at).toLocaleDateString('ar')}
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-bold text-white">{order.total_amount} ₪</p>
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                    order.status === 'confirmed' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                    order.status === 'preparing' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                    order.status === 'delivered' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                    'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                  }`}>
                    {order.status === 'pending' ? 'جديد' :
                     order.status === 'confirmed' ? 'مؤكد' :
                     order.status === 'preparing' ? 'قيد التحضير' :
                     order.status === 'delivered' ? 'تم التوصيل' : order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </ModernSectionLuxury>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <button
          onClick={() => router.push('/dashboard/restaurant/products')}
          className="group backdrop-blur-xl bg-white/5 border border-orange-500/20 rounded-2xl p-6 hover:bg-white/10 hover:border-orange-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20 text-right"
        >
          <Package className="w-12 h-12 text-orange-400 mb-4 group-hover:scale-110 transition" />
          <h3 className="text-xl font-bold text-white mb-2">إدارة الوجبات</h3>
          <p className="text-orange-200 text-sm">أضف وعدّل قائمة الطعام</p>
        </button>

        <button
          onClick={() => router.push('/dashboard/restaurant/orders')}
          className="group backdrop-blur-xl bg-white/5 border border-orange-500/20 rounded-2xl p-6 hover:bg-white/10 hover:border-orange-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20 text-right"
        >
          <ShoppingBag className="w-12 h-12 text-red-400 mb-4 group-hover:scale-110 transition" />
          <h3 className="text-xl font-bold text-white mb-2">الطلبات</h3>
          <p className="text-orange-200 text-sm">تابع طلباتك الحالية</p>
        </button>

        <button
          onClick={() => router.push('/dashboard/restaurant/settings')}
          className="group backdrop-blur-xl bg-white/5 border border-orange-500/20 rounded-2xl p-6 hover:bg-white/10 hover:border-orange-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20 text-right"
        >
          <Settings className="w-12 h-12 text-yellow-400 mb-4 group-hover:scale-110 transition" />
          <h3 className="text-xl font-bold text-white mb-2">الإعدادات</h3>
          <p className="text-orange-200 text-sm">تحديث معلومات المطعم</p>
        </button>
      </div>
    </ModernDashboardLayoutLuxury>
  );
}

export default function RestaurantDashboard() {
  return (
    <div className="min-h-screen bg-slate-950">
      <FuturisticSidebarLuxury role="restaurant" />
      <div className="md:mr-[280px] transition-all duration-300">
        <FuturisticNavbarLuxury userRole="restaurant" />
        <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10">
          <RestaurantDashboardContent />
        </main>
      </div>
    </div>
  );
}
