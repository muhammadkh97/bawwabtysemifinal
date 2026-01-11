'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '@/lib/logger';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import FloatingAddButton from '@/components/dashboard/FloatingAddButton';
import { Package, Clock, CheckCircle, XCircle, Eye, Truck, Calendar, DollarSign, User, Phone, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { updateOrderStatus, OrderStatus } from '@/lib/orderHelpers';
import toast from 'react-hot-toast';

interface Order {
  id: string;
  order_number: string;
  customer: {
    full_name: string;
    phone?: string;
  };
  order_items: {
    id: string;
    product_name: string;
    name?: string;
    name_ar?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function VendorOrdersPageImproved() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const { userId } = useAuth();
  const { formatPrice } = useCurrency();

  const fetchOrders = useCallback(async () => {
    if (!userId) return;
    
    try {
      // Get vendor ID
      const { data: vendorData } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!vendorData) return;

      // Fetch orders through order_items
      const { data: orderItemsData, error } = await supabase
        .from('order_items')
        .select(`
          order_id,
          orders!inner(
            id,
            order_number,
            customer_id,
            total,
            status,
            created_at,
            updated_at
          )
        `)
        .eq('vendor_id', vendorData.id);

      if (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Error fetching order items', { error: errorMessage, component: 'VendorOrdersPage' });
        throw error;
      }

      // Group by order_id
      const ordersMap = new Map<string, any>();
      
      orderItemsData?.forEach((item: any) => {
        const order = item.orders;
        if (!ordersMap.has(order.id)) {
          ordersMap.set(order.id, {
            ...order,
            total_amount: order.total, // Map total to total_amount for consistency
            order_items: [],
            customer: { full_name: '', phone: '' }
          });
        }
      });

      // Get customer details
      const uniqueOrderIds = Array.from(ordersMap.keys());
      if (uniqueOrderIds.length > 0) {
        const customerIds = Array.from(new Set(
          Array.from(ordersMap.values()).map(o => o.customer_id)
        ));
        
        const { data: customersData } = await supabase
          .from('users')
          .select('id, full_name, phone')
          .in('id', customerIds);

        customersData?.forEach((customer: any) => {
          Array.from(ordersMap.values()).forEach((order: any) => {
            if (order.customer_id === customer.id) {
              order.customer = customer;
            }
          });
        });
      }

      // Get order_items
      if (uniqueOrderIds.length > 0) {
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('id, order_id, product_name, name, name_ar, quantity, price, total')
          .eq('vendor_id', vendorData.id)
          .in('order_id', uniqueOrderIds);

        itemsData?.forEach((item: any) => {
          const order = ordersMap.get(item.order_id);
          if (order) {
            order.order_items.push({
              ...item,
              unit_price: item.price, // Map for consistency
              total_price: item.total  // Map for consistency
            });
          }
        });
      }

      setOrders(Array.from(ordersMap.values()).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching orders', { error: errorMessage, component: 'VendorOrdersPage' });
      toast.error('فشل تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleUpdateOrderStatus = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    if (!userId) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    setUpdatingOrderId(orderId);
    
    try {
      const result = await updateOrderStatus(orderId, newStatus, userId);
      
      if (result.success) {
        toast.success('تم تحديث حالة الطلب بنجاح');
        
        // تحديث القائمة المحلية
        await fetchOrders();
      } else {
        toast.error(result.error || 'فشل تحديث حالة الطلب');
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error updating order status', { error: errorMessage, component: 'VendorOrdersPage' });
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setUpdatingOrderId(null);
    }
  }, [userId, fetchOrders]);

  useEffect(() => {
    if (userId) {
      fetchOrders();
    }
  }, [userId, fetchOrders]);

  const filteredOrders = activeFilter === 'all' 
    ? orders 
    : orders.filter(o => o.status === activeFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'processing':
      case 'confirmed':
      case 'preparing':
      case 'ready': return '#6236FF';
      case 'ready_for_pickup': return '#FF6B00';
      case 'picked_up':
      case 'shipped':
      case 'in_transit':
      case 'out_for_delivery': return '#007AFF';
      case 'delivered':
      case 'completed': return '#10B981';
      case 'cancelled':
      case 'refunded': return '#EF4444';
      default: return '#6236FF';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'قيد الانتظار',
      confirmed: 'مؤكد',
      processing: 'قيد التحضير',
      preparing: 'قيد التحضير',
      ready: 'جاهز',
      ready_for_pickup: 'جاهز للاستلام',
      picked_up: 'تم الاستلام',
      shipped: 'تم الشحن',
      in_transit: 'في الطريق',
      out_for_delivery: 'خارج للتوصيل',
      delivered: 'تم التوصيل',
      completed: 'مكتمل',
      cancelled: 'ملغي',
      refunded: 'مسترجع',
    };
    return statusMap[status] || status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'processing':
      case 'confirmed':
      case 'preparing':
      case 'ready': return Package;
      case 'ready_for_pickup': return AlertCircle;
      case 'picked_up':
      case 'shipped':
      case 'in_transit':
      case 'out_for_delivery': return Truck;
      case 'delivered':
      case 'completed': return CheckCircle;
      case 'cancelled':
      case 'refunded': return XCircle;
      default: return Package;
    }
  };

  // الحصول على الإجراءات المتاحة حسب الحالة الحالية
  const getAvailableActions = (currentStatus: string): { status: OrderStatus; label: string }[] => {
    const actions: { status: OrderStatus; label: string }[] = [];
    
    switch (currentStatus) {
      case 'pending':
        actions.push({ status: 'confirmed', label: 'تأكيد الطلب' });
        actions.push({ status: 'cancelled', label: 'إلغاء الطلب' });
        break;
      case 'confirmed':
        actions.push({ status: 'preparing', label: 'بدء التحضير' });
        actions.push({ status: 'cancelled', label: 'إلغاء الطلب' });
        break;
      case 'preparing':
        actions.push({ status: 'ready_for_pickup', label: 'جاهز للاستلام' });
        actions.push({ status: 'cancelled', label: 'إلغاء الطلب' });
        break;
      case 'ready':
        actions.push({ status: 'ready_for_pickup', label: 'جاهز للاستلام' });
        break;
    }
    
    return actions;
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-white transition-colors duration-300">
        <FuturisticSidebar role="vendor" />
        <div className="md:mr-[280px] flex items-center justify-center h-screen">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'إجمالي الطلبات', value: orders.length, color: '#6236FF', icon: Package },
    { label: 'قيد الانتظار', value: orders.filter(o => o.status === 'pending').length, color: '#FF9500', icon: Clock },
    { label: 'قيد التحضير', value: orders.filter(o => ['confirmed', 'processing', 'preparing'].includes(o.status)).length, color: '#6236FF', icon: Package },
    { label: 'تم التسليم', value: orders.filter(o => o.status === 'delivered').length, color: '#10B981', icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 transition-colors duration-300">
      <FuturisticSidebar role="vendor" />
      
      <div className="md:mr-[280px] transition-all duration-300">
        <FuturisticNavbar userName="" userRole="بائع" />
        
        <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10 relative z-10 max-w-[1800px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-gray-800 mb-2">إدارة الطلبات</h1>
            <p className="text-gray-600 text-lg">تتبع ومعالجة طلبات العملاء</p>
          </motion.div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-2xl p-6"
                  style={{
                    background: 'rgba(15, 10, 30, 0.6)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${stat.color}40`,
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <Icon className="w-8 h-8" style={{ color: stat.color }} />
                    <span className="text-3xl font-bold text-white">{stat.value}</span>
                  </div>
                  <p className="text-sm text-purple-300">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Filters */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter as any)}
                className={`px-6 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                  activeFilter === filter
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                    : 'bg-purple-900/30 text-purple-300 hover:bg-purple-800/40'
                }`}
              >
                {filter === 'all' ? 'الكل' : getStatusText(filter)}
              </button>
            ))}
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 rounded-2xl"
                style={{
                  background: 'rgba(15, 10, 30, 0.6)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(98, 54, 255, 0.3)',
                }}
              >
                <Package className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <p className="text-xl text-white font-bold mb-2">لا توجد طلبات</p>
                <p className="text-purple-300">لا توجد طلبات في هذه الفئة</p>
              </motion.div>
            ) : (
              filteredOrders.map((order, index) => {
                const StatusIcon = getStatusIcon(order.status);
                const availableActions = getAvailableActions(order.status);
                const isUpdating = updatingOrderId === order.id;

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-2xl p-6"
                    style={{
                      background: 'rgba(15, 10, 30, 0.6)',
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${getStatusColor(order.status)}40`,
                    }}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ background: `${getStatusColor(order.status)}20` }}
                        >
                          <StatusIcon className="w-6 h-6" style={{ color: getStatusColor(order.status) }} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">{order.order_number}</h3>
                          <p className="text-sm text-purple-300">
                            {order.customer?.full_name || 'عميل'} • {order.order_items?.length || 0} منتج
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className="px-4 py-2 rounded-xl text-sm font-bold"
                          style={{
                            background: `${getStatusColor(order.status)}20`,
                            color: getStatusColor(order.status),
                          }}
                        >
                          {getStatusText(order.status)}
                        </span>
                        <span className="text-2xl font-bold text-white">{formatPrice(order.total_amount)}</span>
                        {order.status === 'ready_for_pickup' && (
                          <button
                            onClick={() => { if (typeof window !== 'undefined') window.location.href = `/dashboard/vendor/orders/${order.id}/pickup-qr`; }}
                            className="px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium text-sm flex items-center gap-2 whitespace-nowrap"
                          >
                            📦 عرض كود الاستلام
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="mb-4 space-y-2">
                      {order.order_items?.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-purple-200">{item.name_ar || item.product_name || item.name}</span>
                          <span className="text-white">
                            {item.quantity} × {formatPrice(item.unit_price)} = {formatPrice(item.total_price)}
                          </span>
                        </div>
                      ))}
                      {order.order_items && order.order_items.length > 3 && (
                        <p className="text-sm text-purple-400">
                          +{order.order_items.length - 3} منتجات أخرى
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {availableActions.length > 0 && (
                      <div className="flex gap-3 flex-wrap">
                        {availableActions.map((action) => (
                          <button
                            key={action.status}
                            onClick={() => handleUpdateOrderStatus(order.id, action.status)}
                            disabled={isUpdating}
                            className={`px-6 py-2 rounded-xl font-medium transition-all ${
                              action.status === 'cancelled'
                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                : 'bg-purple-600 text-white hover:bg-purple-700'
                            } disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                          >
                            {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="mt-4 pt-4 border-t border-purple-500/20">
                      <p className="text-xs text-purple-400">
                        تاريخ الطلب: {new Date(order.created_at).toLocaleString('ar-SA')}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
