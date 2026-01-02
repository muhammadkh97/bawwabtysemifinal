'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { MapPin, Package, Clock, DollarSign, User, Phone, Navigation, Calendar } from 'lucide-react';
import OrdersMapComponent from '@/components/OrdersMapComponent';
import { DriverOrder } from '@/types';

interface Order extends DriverOrder {
  customer_name?: string;
  distance?: number;
  estimated_time?: number;
}

export default function OrdersMapPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [statsData, setStatsData] = useState({
    totalOrders: 0,
    completedToday: 0,
    avgDeliveryTime: '0',
    totalEarnings: 0,
  });

  useEffect(() => {
    loadOrdersAndLocation();
    
    // Get driver's real-time location
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          setDriverLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.error('Location error:', error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, []);

  const loadOrdersAndLocation = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/login');
        return;
      }
      const user = session.user;

      const { data: driverData } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!driverData) {
        toast.error('لم يتم العثور على بيانات السائق');
        return;
      }

      // Load orders with vendor and customer details
      const { data: ordersData, error } = await supabase
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
          users!orders_user_id_fkey (id, name, phone),
          restaurants!orders_restaurant_id_fkey (id, name, latitude, longitude, address)
        `)
        .eq('driver_id', driverData.id)
        .in('status', ['confirmed', 'preparing', 'ready', 'out_for_delivery'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (ordersData) {
        const enrichedOrders = ordersData.map((o: any) => ({
          id: o.id,
          order_number: o.order_number,
          total: o.total,
          status: o.status,
          created_at: o.created_at,
          delivery_latitude: o.delivery_latitude,
          delivery_longitude: o.delivery_longitude,
          delivery_address: o.delivery_address,
          customer: {
            id: o.users?.id || '',
            name: o.users?.name || 'غير متوفر',
            phone: o.users?.phone || 'غير متوفر',
          },
          vendor: {
            id: o.restaurants?.id || '',
            store_name: o.restaurants?.name || 'غير متوفر',
            store_latitude: o.restaurants?.latitude,
            store_longitude: o.restaurants?.longitude,
            store_address: o.restaurants?.address,
          },
          customer_name: o.users?.name || 'غير متوفر',
        }));

        setOrders(enrichedOrders);
        calculateStats(enrichedOrders);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('حدث خطأ في تحميل الطلبات');
      setLoading(false);
    }
  };

  const calculateStats = (ordersList: Order[]) => {
    const completed = ordersList.filter((o) => o.status === 'delivered').length;
    const total = ordersList.length;
    const earnings = ordersList.reduce((sum, o) => sum + (o.total || 0), 0);

    setStatsData({
      totalOrders: total,
      completedToday: completed,
      avgDeliveryTime: '25', // Static for now
      totalEarnings: earnings,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-purple-100 text-purple-800';
      case 'out_for_delivery':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      confirmed: 'مؤكد',
      preparing: 'قيد التحضير',
      ready: 'جاهز',
      out_for_delivery: 'قيد التوصيل',
      delivered: 'تم التوصيل',
    };
    return statusMap[status] || status;
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter((o) => o.status === filterStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل الخريطة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-4">
            <Navigation className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              خريطة الطلبات
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            عرض جميع طلباتك على الخريطة وإدارة التوصيلات
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">إجمالي الطلبات</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {statsData.totalOrders}
                </p>
              </div>
              <Package className="w-10 h-10 text-blue-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">المكتمل اليوم</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {statsData.completedToday}
                </p>
              </div>
              <Package className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">متوسط التوصيل</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {statsData.avgDeliveryTime} دقيقة
                </p>
              </div>
              <Clock className="w-10 h-10 text-orange-500 opacity-50" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">الأرباح</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {statsData.totalEarnings.toFixed(0)} ر.س
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-green-600 opacity-50" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="h-[600px] rounded-lg overflow-hidden">
                {driverLocation ? (
                  <OrdersMapComponent
                    orders={filteredOrders}
                    driverLocation={driverLocation}
                    selectedOrder={selectedOrder}
                    onSelectOrder={setSelectedOrder}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-700">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 dark:text-gray-400">
                        جاري تحديد موقعك...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Orders List Section */}
          <div className="flex flex-col gap-4">
            {/* Filter */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                تصفية حسب الحالة
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">جميع الطلبات</option>
                <option value="confirmed">مؤكد</option>
                <option value="preparing">قيد التحضير</option>
                <option value="ready">جاهز</option>
                <option value="out_for_delivery">قيد التوصيل</option>
              </select>
            </div>

            {/* Orders List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col h-[calc(600px-70px)]">
              <div className="flex-1 overflow-y-auto">
                {filteredOrders.length === 0 ? (
                  <div className="flex items-center justify-center h-full p-4">
                    <div className="text-center">
                      <Package className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 dark:text-gray-400">لا توجد طلبات</p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredOrders.map((order) => (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`p-4 cursor-pointer transition-colors ${
                          selectedOrder?.id === order.id
                            ? 'bg-blue-50 dark:bg-blue-900'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              #{order.order_number}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(order.created_at || '').toLocaleDateString('ar-SA')}
                            </p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ml-2 ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <User className="w-4 h-4 text-gray-500" />
                            <span>{order.customer?.name}</span>
                          </div>
                          <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                            <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                            <span className="text-xs">{order.delivery_address}</span>
                          </div>
                          {order.customer?.phone && (
                            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                              <Phone className="w-4 h-4 text-gray-500" />
                              <span className="text-xs">{order.customer.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {order.total} ر.س
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Order Details */}
            {selectedOrder && (
              <div className="bg-blue-50 dark:bg-blue-900 rounded-lg shadow p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  تفاصيل الطلب
                </h3>
                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex justify-between">
                    <span>رقم الطلب:</span>
                    <span className="font-semibold">#{selectedOrder.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>المتجر:</span>
                    <span className="font-semibold">{selectedOrder.vendor?.store_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>العميل:</span>
                    <span className="font-semibold">{selectedOrder.customer?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الحالة:</span>
                    <span className={`font-semibold ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusText(selectedOrder.status)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-200 dark:border-blue-700">
                    <span className="font-semibold">المجموع:</span>
                    <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                      {selectedOrder.total} ر.س
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
