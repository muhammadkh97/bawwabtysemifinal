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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          users!orders_user_id_fkey (name)
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          طلباتي
        </h1>

        {orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              لا توجد طلبات حالية
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
                      العميل: {order.customer_name}
                    </p>
                  </div>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full h-fit">
                    {order.status === 'confirmed' && 'مؤكد'}
                    {order.status === 'preparing' && 'قيد التحضير'}
                    {order.status === 'ready' && 'جاهز'}
                    {order.status === 'out_for_delivery' && 'في الطريق'}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    الإجمالي: {order.total.toFixed(2)} ر.س
                  </p>
                  <p className="text-sm font-semibold text-green-600">
                    رسوم التوصيل: {order.delivery_fee.toFixed(2)} ر.س
                  </p>
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
                  onClick={() => completeDelivery(order.id)}
                  className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  إتمام التوصيل
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
