'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import { ShoppingBag, Clock, CheckCircle, XCircle, Package, DollarSign, Truck, Calendar } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  delivery_address: string;
  delivery_type?: string;
  pickup_time?: string;
  is_ready_for_pickup?: boolean;
  batch_id?: string;
  batch_number?: string;
  customer: {
    name: string;
    phone: string;
  } | null;
}

export default function RestaurantOrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendorId, setVendorId] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: vendorData } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (vendorData) {
        setVendorId(vendorData.id);
        await fetchOrders(vendorData.id);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      router.push('/auth/login');
    }
  };

  const fetchOrders = async (vId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          delivery_batches (batch_number),
          customer:users!orders_customer_id_fkey(name, phone)
        `)
        .eq('vendor_id', vId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data || []).map((order: any) => ({
        ...order,
        batch_number: order.delivery_batches?.batch_number
      })));
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-purple-100 text-purple-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'confirmed': return 'مؤكد';
      case 'preparing': return 'قيد التحضير';
      case 'ready': return 'جاهز';
      case 'delivered': return 'تم التوصيل';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  const filteredOrders = activeFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === activeFilter);

  const markReadyForPickup = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ is_ready_for_pickup: true })
        .eq('id', orderId);

      if (error) throw error;
      
      await fetchOrders(vendorId);
      alert('✅ تم تحديث الطلب - جاهز للاستلام');
    } catch (error) {
      console.error('Error:', error);
      alert('حدث خطأ');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <FuturisticNavbar />
      <div className="flex">
        <FuturisticSidebar role="restaurant" />
        <div className="md:mr-[280px] transition-all duration-300 w-full">
          <main className="pt-16 sm:pt-20 md:pt-24 px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 md:pb-10">
          <div className="mb-8">
            <h1 className="text-4xl font-black text-gray-900 mb-2">📦 الطلبات</h1>
            <p className="text-gray-600">إدارة ومتابعة طلبات المطعم</p>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {['all', 'pending', 'confirmed', 'preparing', 'ready', 'delivered'].map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-6 py-2 rounded-xl font-bold whitespace-nowrap transition ${
                  activeFilter === filter
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {filter === 'all' ? 'الكل' : getStatusText(filter)}
              </button>
            ))}
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 shadow-lg text-center">
              <ShoppingBag className="w-20 h-20 text-orange-600 mx-auto mb-4 opacity-50" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">لا توجد طلبات</h2>
              <p className="text-gray-600">لم تستلم أي طلبات بعد</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          طلب #{order.order_number || order.id.slice(0, 8)}
                        </h3>
                        {/* Delivery Type Badge */}
                        {order.delivery_type && (
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            order.delivery_type === 'instant' 
                              ? 'bg-orange-100 text-orange-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {order.delivery_type === 'instant' ? '⚡ فوري' : '📦 مجدول'}
                          </span>
                        )}
                        {/* Ready for Pickup Badge */}
                        {order.is_ready_for_pickup && (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                            ✅ جاهز للاستلام
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {/* Batch Number for scheduled orders */}
                      {order.batch_number && (
                        <p className="text-sm text-cyan-600 mt-1 flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          بكج توصيل: {order.batch_number}
                        </p>
                      )}
                      {/* Pickup Time for scheduled orders */}
                      {order.pickup_time && (
                        <p className="text-sm text-purple-600 mt-1 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          موعد الاستلام: {new Date(order.pickup_time).toLocaleDateString('ar-EG', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                    
                    <span className={`px-4 py-2 rounded-xl font-bold ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">المبلغ</p>
                        <p className="font-bold text-gray-900">{order.total_amount} ₪</p>
                      </div>
                    </div>

                    {order.customer?.name && (
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-600">العميل</p>
                          <p className="font-bold text-gray-900">{order.customer.name}</p>
                        </div>
                      </div>
                    )}

                    {order.customer?.phone && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="text-sm text-gray-600">الهاتف</p>
                          <p className="font-bold text-gray-900">{order.customer.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {order.delivery_address && (
                    <p className="text-sm text-gray-600 mb-4">
                      <strong>العنوان:</strong> {order.delivery_address}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-orange-50 text-orange-600 rounded-xl font-bold hover:bg-orange-100 transition">
                      عرض التفاصيل
                    </button>
                    
                    {/* Ready for Pickup Button for scheduled orders */}
                    {order.delivery_type === 'scheduled' && 
                     !order.is_ready_for_pickup && 
                     ['confirmed', 'preparing'].includes(order.status) && (
                      <button
                        onClick={() => markReadyForPickup(order.id)}
                        className="flex-1 py-2 bg-green-50 text-green-600 rounded-xl font-bold hover:bg-green-100 transition flex items-center justify-center gap-2"
                      >
                        <Truck className="w-4 h-4" />
                        جاهز للاستلام
                      </button>
                    )}
                    
                    {/* Alert for instant orders */}
                    {order.delivery_type === 'instant' && order.status === 'confirmed' && (
                      <div className="flex-1 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-center flex items-center justify-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">⏱️ 20 دقيقة</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          </main>
        </div>
      </div>
    </>
  );
}

