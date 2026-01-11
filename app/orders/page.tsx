'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  stores?: {
    store_name: string;
    shop_name: string;
    shop_name_ar: string;
  };
  order_items?: any[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          stores!vendor_id(store_name, shop_name, shop_name_ar),
          order_items(id)
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`فشل جلب الطلبات: ${error.message}`);
      }
      
      setOrders(data || []);
      
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'خطأ في جلب الطلبات';
      
      logger.error('fetchOrders failed', {
        error: errorMessage,
        component: 'OrdersPage',
      });
      
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'delivered':
        return '✅ تم التسليم';
      case 'shipped':
        return '🚚 قيد التوصيل';
      case 'processing':
        return '⏳ قيد المعالجة';
      case 'pending':
        return '⏰ قيد الانتظار';
      case 'cancelled':
        return '❌ ملغى';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 py-4 md:py-8 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-xl text-gray-600">جاري تحميل طلباتك...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-gray-50 py-4 md:py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">طلباتي</h1>
            <p className="text-gray-600">تتبع جميع طلباتك وحالتها ({orders.length})</p>
          </div>

          {/* Orders List */}
          {orders.length === 0 ? (
            <div className="bg-white rounded-xl p-12 md:p-16 text-center shadow-sm border border-gray-200">
              <p className="text-5xl md:text-6xl mb-4">📦</p>
              <p className="text-xl md:text-2xl font-bold text-gray-800 mb-2">لا توجد طلبات</p>
              <p className="text-gray-600 mb-6">ابدأ التسوق واطلب منتجاتك المفضلة</p>
              <Link
                href="/products"
                className="inline-block bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 md:px-8 py-3 rounded-lg md:rounded-xl font-bold hover:shadow-lg transition-all"
              >
                تصفح المنتجات 🛍️
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Order Info */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-800">
                          {order.order_number || `#${order.id.slice(0, 8)}`}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>📅 {new Date(order.created_at).toLocaleDateString('ar-SA')}</p>
                        {order.stores && <p>🏪 {order.stores.shop_name_ar || order.stores.shop_name || order.stores.store_name}</p>}
                        {order.order_items && <p>📦 {order.order_items.length} منتج</p>}
                      </div>
                    </div>

                    {/* Price & Action */}
                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <p className="text-sm text-gray-600 mb-1">المجموع</p>
                        <p className="text-2xl font-bold text-gray-800">{order.total.toLocaleString('ar-SA')} ر.س</p>
                      </div>
                      <Link
                        href={`/orders/${order.id}`}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-bold hover:shadow-lg transition-all"
                      >
                        التفاصيل
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Padding */}
          <div className="h-20 md:h-0" />
        </div>
      </main>

      <Footer />
    </>
  );
}
