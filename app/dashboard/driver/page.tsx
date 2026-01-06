'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import FuturisticStatCard from '@/components/dashboard/FuturisticStatCard';
import { 
  Package, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  MapPin, 
  Navigation,
  CheckCircle,
  AlertCircle,
  Zap,
  Star,
  Phone,
  Map as MapIcon
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { DriverOrder } from '@/types';

const OrdersMapComponent = dynamic(() => import('@/components/OrdersMapComponent'), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div></div>
});

interface DashboardStats {
  total_deliveries: number;
  pending_deliveries: number;
  completed_today: number;
  total_earnings: number;
  today_earnings: number;
  average_rating: number;
}

export default function DriverDashboard() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    total_deliveries: 0,
    pending_deliveries: 0,
    completed_today: 0,
    total_earnings: 0,
    today_earnings: 0,
    average_rating: 0
  });
  const [driverId, setDriverId] = useState<string | null>(null);
  const [activeOrders, setActiveOrders] = useState<DriverOrder[]>([]);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<DriverOrder | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    loadDashboardData();
    
    // Get driver's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setDriverLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.error('Location error:', error)
      );
    }
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('يرجى تسجيل الدخول أولاً');
        router.push('/login');
        return;
      }

      // Get driver ID
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('id, is_available')
        .eq('user_id', user.id)
        .single();

      if (driverError || !driverData) {
        toast.error('⚠️ يجب أن تكون مندوب توصيل');
        router.push('/');
        return;
      }

      setDriverId(driverData.id);
      setIsAvailable(driverData.is_available || false);

      // Calculate stats manually from orders
      const { data: allOrders } = await supabase
        .from('orders')
        .select('status, delivery_fee, created_at')
        .eq('driver_id', driverData.id);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const totalDeliveries = allOrders?.filter(o => o.status === 'delivered').length || 0;
      const pendingDeliveries = allOrders?.filter(o => ['ready_for_pickup', 'picked_up', 'in_transit', 'out_for_delivery'].includes(o.status)).length || 0;
      const completedToday = allOrders?.filter(o => {
        const orderDate = new Date(o.created_at);
        return o.status === 'delivered' && orderDate >= today;
      }).length || 0;

      const totalEarnings = allOrders?.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.delivery_fee || 0), 0) || 0;
      const todayEarnings = allOrders?.filter(o => {
        const orderDate = new Date(o.created_at);
        return o.status === 'delivered' && orderDate >= today;
      }).reduce((sum, o) => sum + (o.delivery_fee || 0), 0) || 0;

      setStats({
        total_deliveries: totalDeliveries,
        pending_deliveries: pendingDeliveries,
        completed_today: completedToday,
        total_earnings: totalEarnings,
        today_earnings: todayEarnings,
        average_rating: 0
      });

      // Load active orders with delivery type and batch info
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total_amount,
          delivery_fee,
          delivery_address,
          status,
          created_at,
          delivery_type,
          batch_id,
          delivery_batches (batch_number, status),
          users!orders_customer_id_fkey (id, full_name, phone),
          stores!orders_vendor_id_fkey (id, shop_name, latitude, longitude)
        `)
        .eq('driver_id', driverData.id)
        .in('status', ['ready_for_pickup', 'picked_up', 'in_transit', 'out_for_delivery'])
        .order('delivery_type', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(5);

      if (!ordersError && ordersData) {
        const enrichedOrders = ordersData.map((o: any): DriverOrder => ({
          id: o.id,
          order_number: o.order_number,
          total: o.total_amount,
          delivery_fee: o.delivery_fee,
          status: o.status,
          created_at: o.created_at,
          delivery_latitude: undefined,
          delivery_longitude: undefined,
          delivery_address: o.delivery_address,
          delivery_type: o.delivery_type,
          batch_id: o.batch_id,
          batch_number: o.delivery_batches?.batch_number,
          batch_status: o.delivery_batches?.status,
          customer: {
            id: o.users?.id || '',
            name: o.users?.full_name || 'غير متوفر',
            phone: o.users?.phone,
          },
          vendor: {
            id: o.stores?.id || '',
            store_name: o.stores?.shop_name || 'غير متوفر',
            store_latitude: o.stores?.latitude,
            store_longitude: o.stores?.longitude,
          },
        }));
        setActiveOrders(enrichedOrders);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('حدث خطأ غير متوقع');
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    if (!driverId) return;
    
    try {
      const newStatus = !isAvailable;
      
      const { error } = await supabase
        .from('drivers')
        .update({ is_available: newStatus })
        .eq('id', driverId);
      
      if (error) throw error;
      
      setIsAvailable(newStatus);
      toast.success(newStatus ? '✅ أنت الآن متاح لاستقبال الطلبات' : '⚠️ تم إيقاف استقبال الطلبات');
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast.error('فشل تحديث الحالة');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'preparing': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'ready': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'out_for_delivery': return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      confirmed: 'مؤكد',
      preparing: 'قيد التحضير',
      ready: 'جاهز',
      out_for_delivery: 'قيد التوصيل',
    };
    return statusMap[status] || status;
  };

  const statsCards = [
    {
      title: 'إجمالي التوصيلات',
      value: stats.total_deliveries.toString(),
      icon: Package,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'قيد التنفيذ',
      value: stats.pending_deliveries.toString(),
      icon: Clock,
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      title: 'اليوم',
      value: stats.completed_today.toString(),
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      title: 'التقييم',
      value: stats.average_rating.toFixed(1),
      icon: Star,
      gradient: 'from-yellow-500 to-orange-500',
    },
  ];

  const quickStats = [
    { 
      label: 'أرباح اليوم', 
      value: `${stats.today_earnings.toFixed(0)} ر.س`, 
      icon: DollarSign, 
      color: 'from-purple-500 to-pink-500' 
    },
    { 
      label: 'إجمالي الأرباح', 
      value: `${stats.total_earnings.toFixed(0)} ر.س`, 
      icon: TrendingUp, 
      color: 'from-emerald-500 to-teal-500' 
    },
    { 
      label: 'طلبات نشطة', 
      value: activeOrders.length.toString(), 
      icon: Zap, 
      color: 'from-blue-500 to-indigo-500' 
    },
    { 
      label: 'معدل التوصيل', 
      value: stats.completed_today > 0 ? `${(stats.today_earnings / stats.completed_today).toFixed(0)} ر.س` : '0 ر.س', 
      icon: TrendingUp, 
      color: 'from-orange-500 to-red-500' 
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-purple-300 text-lg">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Animated Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.2, 0.3],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, #6236FF 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/2 -left-40 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, #FF219D 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute bottom-20 right-1/3 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, #B621FE 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10">
        {/* Welcome Section with Availability Toggle */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Navigation className="w-10 h-10" />
                لوحة تحكم المندوب 🚗
              </h1>
              <p className="text-purple-200">تابع طلباتك وأرباحك في الوقت الفعلي</p>
            </div>
            
            {/* Availability Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleAvailability}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg ${
                isAvailable
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                  : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-gray-200'
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${isAvailable ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
              {isAvailable ? 'متاح للطلبات' : 'غير متاح'}
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <FuturisticStatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              gradient={stat.gradient}
              delay={index * 0.1}
            />
          ))}
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {quickStats.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="backdrop-blur-xl bg-white/5 border border-purple-500/20 rounded-xl p-4 text-center hover:bg-white/10 transition-all duration-300"
            >
              <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-white mb-1">{item.value}</p>
              <p className="text-sm text-purple-200">{item.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Map Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2"
          >
            <div className="backdrop-blur-xl bg-white/5 border border-purple-500/20 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-purple-500/20">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <MapIcon className="w-6 h-6 text-purple-400" />
                  خريطة الطلبات النشطة
                </h2>
                <p className="text-purple-200 text-sm mt-1">
                  {activeOrders.length} طلب نشط
                </p>
              </div>
              <div className="h-[500px] bg-[#0A0515]">
                {driverLocation && activeOrders.length > 0 ? (
                  <OrdersMapComponent
                    orders={activeOrders}
                    driverLocation={driverLocation}
                    selectedOrder={selectedOrder}
                    onSelectOrder={setSelectedOrder}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 text-purple-400/50 mx-auto mb-3" />
                      <p className="text-purple-300">
                        {!driverLocation ? 'جاري تحديد موقعك...' : 'لا توجد طلبات نشطة'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Active Orders List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-4"
          >
            <div className="backdrop-blur-xl bg-white/5 border border-purple-500/20 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-purple-500/20">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Zap className="w-6 h-6 text-purple-400" />
                  الطلبات النشطة
                </h2>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {activeOrders.length === 0 ? (
                  <div className="p-8 text-center">
                    <Package className="w-12 h-12 text-purple-400/50 mx-auto mb-3" />
                    <p className="text-purple-300 text-sm">
                      لا توجد طلبات نشطة حالياً
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-purple-500/10">
                    {activeOrders.map((order) => (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`p-4 cursor-pointer transition-all duration-300 ${
                          selectedOrder?.id === order.id
                            ? 'bg-purple-500/20'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-white text-sm">
                                #{order.order_number}
                              </p>
                              {/* Delivery Type Badge */}
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                order.delivery_type === 'instant' 
                                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' 
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}>
                                {order.delivery_type === 'instant' ? '⚡ فوري' : '📦 مجدول'}
                              </span>
                            </div>
                            <p className="text-xs text-purple-200 mt-0.5">
                              {order.customer.name}
                            </p>
                            {/* Batch Number for scheduled orders */}
                            {order.batch_number && (
                              <p className="text-xs text-cyan-400 mt-1 flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                بكج: {order.batch_number}
                              </p>
                            )}
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-lg border whitespace-nowrap ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-purple-300 mb-2">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{order.delivery_address || 'غير متوفر'}</span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-purple-500/10">
                          <span className="text-sm font-bold text-white">
                            {order.total.toFixed(2)} ر.س
                          </span>
                          <span className="text-xs font-semibold text-green-400">
                            +{(order.delivery_fee || 0).toFixed(2)} ر.س
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
              className="backdrop-blur-xl bg-white/5 border border-purple-500/20 rounded-2xl p-6"
            >
              <h3 className="font-bold text-white mb-4 text-sm">إجراءات سريعة</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/dashboard/driver/available')}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-3 px-4 rounded-xl transition-all text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/50"
                >
                  <Package className="w-4 h-4" />
                  الطلبات المتاحة
                </button>
                <button
                  onClick={() => router.push('/dashboard/driver/orders-map')}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold py-3 px-4 rounded-xl transition-all text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/50"
                >
                  <MapIcon className="w-4 h-4" />
                  خريطة كاملة
                </button>
                <button
                  onClick={() => router.push('/dashboard/driver/earnings')}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-3 px-4 rounded-xl transition-all text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/50"
                >
                  <DollarSign className="w-4 h-4" />
                  الأرباح
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Earnings Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="backdrop-blur-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm mb-1">إجمالي الأرباح</p>
              <p className="text-5xl font-bold text-white">{stats.total_earnings.toFixed(2)} ر.س</p>
              <p className="text-purple-200 text-sm mt-2">
                من {stats.total_deliveries} توصيل مكتمل
              </p>
            </div>
            <div className="text-right">
              <button
                onClick={() => router.push('/dashboard/driver/earnings')}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-8 py-4 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-purple-500/50 text-lg"
              >
                عرض التفاصيل
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
