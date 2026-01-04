'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { Package, MapPin, Check } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  total: number;
  delivery_fee: number;
  delivery_address: any;
  status: string;
  created_at: string;
  customer_name: string;
}

export default function MyOrdersPage() {
  const router = useRouter();
  // Using supabase from lib/supabase
  
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadMyOrders();
  }, []);

  const loadMyOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: driverData } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!driverData) return;

      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total,
          delivery_fee,
          delivery_address,
          status,
          created_at,
          users!orders_customer_id_fkey (name)
        `)
        .eq('driver_id', driverData.id)
        .in('status', ['confirmed', 'preparing', 'ready', 'out_for_delivery'])
        .order('created_at', { ascending: false });

      if (ordersData) {
        setOrders(ordersData.map((o: any) => ({
          ...o,
          customer_name: o.users?.name || 'غير متوفر'
        })));
      }

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const completeDelivery = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'delivered' })
      .eq('id', orderId);

    if (!error) {
      toast.success('✅ تم إتمام التوصيل!');
      loadMyOrders();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              طلباتي الحالية
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            إدارة وتتبع طلباتك وحالتها في الوقت الفعلي
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              لا توجد طلبات حالية
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              انتقل إلى قسم الطلبات المتاحة لاختيار طلب جديد
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        طلب #{order.order_number}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        العميل: {order.customer_name}
                      </p>
                    </div>
                    <span className={`mt-2 md:mt-0 text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap ${
                      order.status === 'confirmed' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                    } ${
                      order.status === 'preparing' && 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                    } ${
                      order.status === 'ready' && 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100'
                    } ${
                      order.status === 'out_for_delivery' && 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100'
                    } ${
                      order.status === 'delivered' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                    }`}>
                      {order.status === 'confirmed' && 'مؤكد'}
                      {order.status === 'preparing' && 'قيد التحضير'}
                      {order.status === 'ready' && 'جاهز'}
                      {order.status === 'out_for_delivery' && 'قيد التوصيل'}
                      {order.status === 'delivered' && 'تم التوصيل'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold">الإجمالي</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                        {order.total.toFixed(2)} ر.س
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-semibold">رسوم التوصيل</p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
                        +{order.delivery_fee.toFixed(2)} ر.س
                      </p>
                    </div>
                  </div>

                  {order.delivery_address && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex gap-3">
                        <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                            عنوان التوصيل
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {order.delivery_address.address || 'غير متوفر'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {order.status !== 'delivered' && (
                    <button
                      onClick={() => completeDelivery(order.id)}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <Check className="w-5 h-5" />
                      تأكيد التوصيل
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
