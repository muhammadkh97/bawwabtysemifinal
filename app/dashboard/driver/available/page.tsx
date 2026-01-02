'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { Package, MapPin, DollarSign, Check } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  total: number;
  delivery_fee: number;
  delivery_address: any;
  created_at: string;
  customer_name: string;
  customer_phone: string;
}

export default function AvailableOrdersPage() {
  const router = useRouter();
  // Using supabase from lib/supabase
  
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [driverId, setDriverId] = useState<string | null>(null);

  useEffect(() => {
    loadAvailableOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAvailableOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('يرجى تسجيل الدخول أولاً');
        router.push('/login');
        return;
      }

      const { data: driverData } = await supabase
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
          total,
          delivery_fee,
          delivery_address,
          created_at,
          users!orders_customer_id_fkey (name, phone)
        `)
        .eq('status', 'pending')
        .is('driver_id', null)
        .order('created_at', { ascending: false });

      if (!error && ordersData) {
        setOrders(ordersData.map((o: any) => ({
          ...o,
          customer_name: o.users?.name || 'غير متوفر',
          customer_phone: o.users?.phone || 'غير متوفر'
        })));
      }

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const acceptOrder = async (orderId: string) => {
    if (!driverId) return;

    const { error } = await supabase
      .from('orders')
      .update({ driver_id: driverId, status: 'confirmed' })
      .eq('id', orderId);

    if (!error) {
      toast.success('✅ تم قبول الطلب!');
      loadAvailableOrders();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          الطلبات المتاحة
        </h1>

        {orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              لا توجد طلبات متاحة
            </h3>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      طلب #{order.order_number}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(order.created_at).toLocaleString('ar-SA')}
                    </p>
                  </div>
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-3 py-1 rounded-full h-fit">
                    متاح
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      العميل: {order.customer_name}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      الهاتف: {order.customer_phone}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      الإجمالي: {order.total.toFixed(2)} ر.س
                    </p>
                    <p className="text-sm font-semibold text-green-600">
                      رسوم التوصيل: {order.delivery_fee.toFixed(2)} ر.س
                    </p>
                  </div>
                </div>

                {order.delivery_address && (
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex gap-2">
                      <MapPin className="w-4 h-4 text-gray-600 mt-1" />
                      <div className="text-sm">
                        <p className="font-medium mb-1">عنوان التوصيل:</p>
                        <p className="text-gray-700 dark:text-gray-300">
                          {order.delivery_address.address || 'غير متوفر'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => acceptOrder(order.id)}
                  className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  قبول الطلب
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
