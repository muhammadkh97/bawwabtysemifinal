'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import { Package, MapPin, DollarSign, Check, Phone, User } from 'lucide-react';

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
  
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadAvailableOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAvailableOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('يرجى تسجيل الدخول أولاً');
        router.push('/auth/login');
        return;
      }

      // Get user name
      const { data: userData } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single();
      
      if (userData) {
        setUserName(userData.name || 'مندوب التوصيل');
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
      toast.error('فشل تحميل الطلبات');
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
    } else {
      toast.error('فشل قبول الطلب');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-[#0A0515]">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-[#0A0515] transition-colors duration-300">
      <FuturisticSidebar role="driver" />
      
      <div className="md:mr-[280px] transition-all duration-300">
        <FuturisticNavbar userName={userName} userRole="مندوب توصيل" />
        
        <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10 relative z-10 max-w-[1800px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-2">الطلبات المتاحة</h1>
            <p className="text-purple-300 text-lg">اختر الطلبات التي تريد توصيلها</p>
          </motion.div>

          {orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl p-12 text-center"
              style={{
                background: 'rgba(15, 10, 30, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(98, 54, 255, 0.3)',
              }}
            >
              <Package className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-white mb-2">
                لا توجد طلبات متاحة
              </h3>
              <p className="text-purple-300">سيتم عرض الطلبات الجديدة هنا تلقائياً</p>
            </motion.div>
          ) : (
            <div className="grid gap-6">
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-2xl p-6"
                  style={{
                    background: 'rgba(15, 10, 30, 0.6)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(98, 54, 255, 0.3)',
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        طلب #{order.order_number}
                      </h3>
                      <p className="text-sm text-purple-300">
                        {new Date(order.created_at).toLocaleString('ar-SA')}
                      </p>
                    </div>
                    <span className="px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border border-yellow-500/30">
                      متاح للقبول
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-purple-200">
                        <User className="w-5 h-5 text-purple-400" />
                        <span>{order.customer_name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-purple-200">
                        <Phone className="w-5 h-5 text-purple-400" />
                        <span dir="ltr">{order.customer_phone}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-purple-400" />
                        <span className="text-purple-200">الإجمالي:</span>
                        <span className="text-white font-bold">{order.total.toFixed(2)} ر.س</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-green-400" />
                        <span className="text-purple-200">رسوم التوصيل:</span>
                        <span className="text-green-300 font-bold">{order.delivery_fee.toFixed(2)} ر.س</span>
                      </div>
                    </div>
                  </div>

                  {order.delivery_address && (
                    <div className="mb-4 p-4 rounded-xl" style={{
                      background: 'rgba(98, 54, 255, 0.1)',
                      border: '1px solid rgba(98, 54, 255, 0.2)',
                    }}>
                      <div className="flex gap-3">
                        <MapPin className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-white mb-1">عنوان التوصيل:</p>
                          <p className="text-purple-200 text-sm">
                            {order.delivery_address.address || 'غير متوفر'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => acceptOrder(order.id)}
                    className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 transition-all duration-300"
                  >
                    <Check className="w-5 h-5" />
                    قبول الطلب والبدء بالتوصيل
                  </motion.button>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
