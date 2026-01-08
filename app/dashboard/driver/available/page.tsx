'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { Package, MapPin, DollarSign, Check, Zap, Clock } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  total: number;
  delivery_fee: number;
  delivery_address: any;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  delivery_type?: string;
  batch_number?: string;
}

export default function AvailableOrdersPage() {
  const router = useRouter();
  // Using supabase from lib/supabase
  
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<'all' | 'instant' | 'scheduled'>('all');

  useEffect(() => {
    loadAvailableOrders();
  }, []);

  const loadAvailableOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('يرجى تسجيل الدخول أولاً');
        router.push('/login');
        return;
      }

      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user.id)
        .single();


      if (!driverData) {
        toast.error('⚠️ يجب أن تكون مندوب توصيل');
        return;
      }

      setDriverId(driverData.id);

      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total_amount,
          delivery_fee,
          delivery_address,
          created_at,
          delivery_type,
          batch_id,
          delivery_batches (batch_number),
          users!orders_customer_id_fkey (full_name, phone)
        `)
        .eq('status', 'ready_for_pickup')
        .is('driver_id', null)
        .order('delivery_type', { ascending: true })
        .order('created_at', { ascending: false });


      if (!error && ordersData) {
        setOrders(ordersData.map((o: any) => ({
          ...o,
          total: o.total_amount,
          customer_name: o.users?.full_name || 'غير متوفر',
          customer_phone: o.users?.phone || 'غير متوفر',
          delivery_type: o.delivery_type,
          batch_number: o.delivery_batches?.batch_number
        })));
      }

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const acceptOrder = async (orderId: string) => {
    if (!driverId) {
      toast.error('⚠️ لم يتم التعرف على حساب السائق');
      return;
    }


    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          driver_id: driverId, 
          status: 'picked_up' 
        })
        .eq('id', orderId)
        .select();


      if (error) {
        console.error('❌ [Accept Order] Error:', error);
        toast.error(`فشل قبول الطلب: ${error.message}`);
        return;
      }

      if (data && data.length > 0) {
        toast.success('✅ تم قبول الطلب!');
        // إزالة الطلب من القائمة فوراً
        setOrders(prevOrders => prevOrders.filter(o => o.id !== orderId));
        // إعادة تحميل القائمة للتأكد
        setTimeout(() => loadAvailableOrders(), 500);
      } else {
        toast.error('⚠️ لم يتم العثور على الطلب أو تم قبوله من قبل سائق آخر');
        loadAvailableOrders();
      }
    } catch (err) {
      console.error('❌ [Accept Order] Exception:', err);
      toast.error('حدث خطأ أثناء قبول الطلب');
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
            <Zap className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              الطلبات المتاحة
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            اختر الطلبات التي تريد تنفيذها واحصل على أرباح إضافية
          </p>
          
          {/* Delivery Type Filter */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setDeliveryTypeFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                deliveryTypeFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              الكل ({orders.length})
            </button>
            <button
              onClick={() => setDeliveryTypeFilter('instant')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                deliveryTypeFilter === 'instant'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              ⚡ فوري ({orders.filter(o => o.delivery_type === 'instant').length})
            </button>
            <button
              onClick={() => setDeliveryTypeFilter('scheduled')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                deliveryTypeFilter === 'scheduled'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              📦 مجدول ({orders.filter(o => o.delivery_type === 'scheduled').length})
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {orders.filter(o => deliveryTypeFilter === 'all' || o.delivery_type === deliveryTypeFilter).length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              لا توجد طلبات متاحة حالياً
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              تحقق لاحقاً من الطلبات الجديدة أو جرّب البحث بمعايير مختلفة
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders
              .filter(o => deliveryTypeFilter === 'all' || o.delivery_type === deliveryTypeFilter)
              .map((order) => (
              <div
                key={order.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          طلب #{order.order_number}
                        </h3>
                        {/* Delivery Type Badge */}
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          order.delivery_type === 'instant' 
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200' 
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {order.delivery_type === 'instant' ? '⚡ فوري' : '📦 مجدول'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        العميل: {order.customer_name}
                      </p>
                      {/* Batch Number */}
                      {order.batch_number && (
                        <p className="text-sm text-cyan-600 dark:text-cyan-400 mt-1 flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          بكج: {order.batch_number}
                        </p>
                      )}
                    </div>
                    <span className="mt-2 md:mt-0 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap">
                      متاح الآن
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

                  {order.customer_phone && (
                    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                        📞 {order.customer_phone}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => acceptOrder(order.id)}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <Check className="w-5 h-5" />
                    قبول الطلب
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
