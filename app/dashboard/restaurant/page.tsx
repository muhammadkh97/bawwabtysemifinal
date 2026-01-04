'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import { 
  ChefHat, Package, DollarSign, Users, TrendingUp, Clock,
  ShoppingBag, Star, MapPin, Phone, Eye, EyeOff, Settings
} from 'lucide-react';

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  averageRating: number;
  todayOrders: number;
  pendingOrders: number;
}

export default function RestaurantDashboard() {
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

      // تم نقل التحقق من الدور إلى RestaurantLayout باستخدام ProtectedRoute
      // لضمان تجربة مستخدم أفضل ومنع حلقات إعادة التوجيه

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
      console.error('Error checking auth:', error);
      router.push('/auth/login');
    }
  };

  const fetchStats = async (restaurantId: string) => {
    try {
      const { data: statsData, error: statsError } = await supabase.rpc('get_restaurant_dashboard_stats', { p_restaurant_id: restaurantId });
      if (statsError) throw statsError;
      const statsRow = (statsData && statsData[0]) || {};

      setStats({
        totalOrders: Number(statsRow.total_orders || 0),
        totalRevenue: Number(statsRow.total_revenue || 0),
        totalProducts: Number(statsRow.total_menu_items || 0),
        averageRating: Number(statsRow.avg_rating || 0),
        todayOrders: Number(statsRow.today_orders || 0),
        pendingOrders: Number(statsRow.pending_orders || 0),
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentOrders(data || []);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
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
      alert(newStatus ? '✅ المطعم الآن متصل!' : '⚪ المطعم الآن غير متصل');
    } catch (error) {
      console.error('Error toggling online status:', error);
      alert('حدث خطأ في تحديث الحالة');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'إجمالي الطلبات',
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
    {
      title: 'إجمالي الإيرادات',
      value: `${stats.totalRevenue.toFixed(2)} ₪`,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'عدد الوجبات',
      value: stats.totalProducts,
      icon: Package,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'التقييم',
      value: stats.averageRating.toFixed(1),
      icon: Star,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <FuturisticNavbar />
      
      <div className="flex">
        <FuturisticSidebar role="restaurant" />
        
        {/* Main Content Area - Responsive */}
        <div className="md:mr-[280px] transition-all duration-300 w-full">
          <main className="pt-16 sm:pt-20 md:pt-24 px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 md:pb-10">
            {/* Online/Offline Toggle - Fixed Position */}
            <div className="fixed top-16 sm:top-20 md:top-4 left-3 sm:left-4 md:left-8 z-40">
              <button
                onClick={toggleOnlineStatus}
                className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm md:text-base shadow-lg transition-all duration-300 ${
                  isOnline
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-green-200'
                    : 'bg-gray-300 text-gray-700 hover:shadow-gray-200'
                }`}
              >
                {isOnline ? (
                  <>
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">🟢 متصل</span>
                    <span className="sm:hidden">🟢</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">⚪ غير متصل</span>
                    <span className="sm:hidden">⚪</span>
                  </>
                )}
              </button>
            </div>

            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-col gap-3 sm:gap-4 mb-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-1 sm:mb-2">
                    لوحة تحكم المطعم 🍽️
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    مرحباً بك في لوحة التحكم - {restaurantInfo?.shop_name_ar}
                  </p>
                </div>
              </div>

              {!isOnline && (
                <div className="bg-yellow-50 border-r-4 border-yellow-500 p-3 sm:p-4 rounded-xl">
                  <p className="text-yellow-800 font-bold text-xs sm:text-sm md:text-base">
                    ⚠️ تنبيه: المطعم غير متصل - لن يظهر للعملاء في الصفحة الرئيسية
                  </p>
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {statCards.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-14 h-14 rounded-2xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-7 h-7 ${stat.textColor}`} />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-bold mb-2">{stat.title}</h3>
                <p className="text-3xl font-black text-gray-900">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Today's Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl p-6 text-white shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-8 h-8" />
                <h3 className="text-xl font-bold">طلبات اليوم</h3>
              </div>
              <p className="text-5xl font-black">{stats.todayOrders}</p>
              <p className="text-orange-100 mt-2">منذ منتصف الليل</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-6 text-white shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-8 h-8" />
                <h3 className="text-xl font-bold">طلبات معلقة</h3>
              </div>
              <p className="text-5xl font-black">{stats.pendingOrders}</p>
              <p className="text-purple-100 mt-2">بحاجة لمراجعة</p>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <h2 className="text-2xl font-black text-gray-900 mb-6">آخر الطلبات 📋</h2>
            
            {recentOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>لا توجد طلبات حتى الآن</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white font-bold">
                        #{order.id.slice(0, 4)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">
                          {order.customer?.name || 'عميل'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString('ar')}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-900">{order.total} ₪</p>
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'preparing' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
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
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <button
              onClick={() => router.push('/dashboard/restaurant/products')}
              className="bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all group"
            >
              <Package className="w-12 h-12 text-orange-600 mb-4 group-hover:scale-110 transition" />
              <h3 className="text-xl font-bold text-gray-900">إدارة الوجبات</h3>
              <p className="text-gray-600 text-sm mt-2">أضف وعدّل قائمة الطعام</p>
            </button>

            <button
              onClick={() => router.push('/dashboard/restaurant/orders')}
              className="bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all group"
            >
              <ShoppingBag className="w-12 h-12 text-blue-600 mb-4 group-hover:scale-110 transition" />
              <h3 className="text-xl font-bold text-gray-900">الطلبات</h3>
              <p className="text-gray-600 text-sm mt-2">تابع طلباتك الحالية</p>
            </button>

            <button
              onClick={() => router.push('/dashboard/restaurant/settings')}
              className="bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all group"
            >
              <Settings className="w-12 h-12 text-purple-600 mb-4 group-hover:scale-110 transition" />
              <h3 className="text-xl font-bold text-gray-900">الإعدادات</h3>
              <p className="text-gray-600 text-sm mt-2">تحديث معلومات المطعم</p>
            </button>
          </div>
        </main>
        </div>
      </div>
    </div>
  );
}
