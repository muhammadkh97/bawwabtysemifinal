'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
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
  loading: () => <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>
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
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (driverError || !driverData) {
        toast.error('⚠️ يجب أن تكون مندوب توصيل');
        router.push('/');
        return;
      }

      setDriverId(driverData.id);

      // Get dashboard stats using RPC function
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_driver_dashboard_stats', { p_driver_id: driverData.id });

      if (statsError) {
        console.error('Error loading stats:', statsError);
      } else if (statsData && statsData.length > 0) {
        setStats(statsData[0]);
      }

      // Load active orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total,
          delivery_fee,
          delivery_address,
          status,
          created_at,
          delivery_latitude,
          delivery_longitude,
          users!orders_customer_id_fkey (id, name, phone),
          stores!orders_vendor_id_fkey (id, name, latitude, longitude)
        `)
        .eq('driver_id', driverData.id)
        .in('status', ['confirmed', 'preparing', 'ready', 'out_for_delivery'])
        .order('created_at', { ascending: false })
        .limit(5);

      if (!ordersError && ordersData) {
        const enrichedOrders = ordersData.map((o: any) => ({
          id: o.id,
          order_number: o.order_number,
          total: o.total,
          delivery_fee: o.delivery_fee,
          status: o.status,
          created_at: o.created_at,
          delivery_latitude: o.delivery_latitude,
          delivery_longitude: o.delivery_longitude,
          delivery_address: o.delivery_address,
          customer: {
            id: o.users?.id || '',
            name: o.users?.name || 'غير متوفر',
            phone: o.users?.phone,
          },
          vendor: {
            id: o.restaurants?.id || '',
            store_name: o.restaurants?.name || 'غير متوفر',
            store_latitude: o.restaurants?.latitude,
            store_longitude: o.restaurants?.longitude,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'preparing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'ready': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      case 'out_for_delivery': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Navigation className="w-8 h-8" />
                لوحة تحكم المندوب
              </h1>
              <p className="text-blue-100">
                مرحباً بك، تابع طلباتك وأرباحك في الوقت الفعلي
              </p>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <p className="text-xs text-blue-100">التقييم</p>
                <p className="text-xl font-bold flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  {stats.average_rating.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold">إجمالي التوصيلات</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total_deliveries}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold">قيد التنفيذ</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.pending_deliveries}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold">اليوم</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.completed_today}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold">أرباح اليوم</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats.today_earnings.toFixed(0)} ر.س</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <MapIcon className="w-5 h-5 text-blue-600" />
                  خريطة الطلبات النشطة
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {activeOrders.length} طلب نشط
                </p>
              </div>
              <div className="h-[500px]">
                {driverLocation && activeOrders.length > 0 ? (
                  <OrdersMapComponent
                    orders={activeOrders}
                    driverLocation={driverLocation}
                    selectedOrder={selectedOrder}
                    onSelectOrder={setSelectedOrder}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-700">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 dark:text-gray-400">
                        {!driverLocation ? 'جاري تحديد موقعك...' : 'لا توجد طلبات نشطة'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Orders List */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900 dark:to-indigo-800 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-indigo-600" />
                  الطلبات النشطة
                </h2>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {activeOrders.length === 0 ? (
                  <div className="p-8 text-center">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      لا توجد طلبات نشطة حالياً
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {activeOrders.map((order) => (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`p-4 cursor-pointer transition-colors ${
                          selectedOrder?.id === order.id
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 dark:text-white text-sm">
                              #{order.order_number}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {order.customer.name}
                            </p>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded whitespace-nowrap ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{order.delivery_address || 'غير متوفر'}</span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {order.total.toFixed(2)} ر.س
                          </span>
                          <span className="text-xs font-semibold text-green-600 dark:text-green-400">
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm">إجراءات سريعة</h3>
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/dashboard/driver/available')}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  الطلبات المتاحة
                </button>
                <button
                  onClick={() => router.push('/dashboard/driver/orders-map')}
                  className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                >
                  <MapIcon className="w-4 h-4" />
                  خريطة كاملة
                </button>
                <button
                  onClick={() => router.push('/dashboard/driver/location')}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  موقعي
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Earnings Summary */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm mb-1">إجمالي الأرباح</p>
              <p className="text-4xl font-bold">{stats.total_earnings.toFixed(2)} ر.س</p>
              <p className="text-purple-100 text-sm mt-2">
                من {stats.total_deliveries} توصيل مكتمل
              </p>
            </div>
            <div className="text-right">
              <button
                onClick={() => router.push('/dashboard/driver/earnings')}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-3 rounded-lg font-semibold transition-all"
              >
                عرض التفاصيل
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
