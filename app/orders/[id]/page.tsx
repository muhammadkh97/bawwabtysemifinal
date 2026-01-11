'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/contexts/CurrencyContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Loader2, Package, Calendar } from 'lucide-react';
import { logger } from '@/lib/logger';

interface OrderStatus {
  status: string;
  label: string;
  icon: string;
  completed: boolean;
}

interface DriverLocation {
  lat: number;
  lng: number;
  timestamp: string;
}

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const { formatPrice } = useCurrency();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [driverLocation, setDriverLocation] = useState<DriverLocation>({
    lat: 31.9454,
    lng: 35.9284,
    timestamp: new Date().toISOString(),
  });

  const [estimatedTime, setEstimatedTime] = useState(15); // دقائق

  // Download Invoice
  const downloadInvoice = () => {
    const invoiceUrl = `/api/invoice/${params.id}`;
    const link = document.createElement('a');
    link.href = invoiceUrl;
    link.download = `invoice-${order?.order_number || params.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Review Order
  const reviewOrder = () => {
    router.push(`/orders/${params.id}/review`);
  };

  // Fetch order details
  useEffect(() => {
    if (params.id) {
      fetchOrderDetails();
    }
  }, [params.id]);

  const fetchOrderDetails = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch order with store info and batch info
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          stores!vendor_id(store_name, shop_name, shop_name_ar, phone),
          delivery_batches (batch_number, status, scheduled_date, collection_deadline)
        `)
        .eq('id', params.id)
        .eq('customer_id', user.id)
        .single();

      if (orderError) {
        throw new Error(`فشل جلب بيانات الطلب: ${orderError.message}`);
      }

      // Fetch order items
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', params.id);

      if (itemsError) {
        logger.error('Error fetching order items', {
          error: itemsError.message,
          component: 'OrderTrackingPage',
          orderId: params.id,
        });
      }

      setOrder({
        ...orderData,
        items: itemsData || []
      });
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'خطأ في جلب بيانات الطلب';
      
      logger.error('fetchOrderDetails failed', {
        error: errorMessage,
        component: 'OrderTrackingPage',
        orderId: params.id,
      });
      
      router.push('/orders');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  // محاكاة تحديث موقع المندوب Real-time
  useEffect(() => {
    if (order?.status === 'shipped' && order?.delivery_lat && order?.delivery_lng) {
      const interval = setInterval(() => {
        // تحريك المندوب تدريجياً نحو العنوان
        setDriverLocation(prev => ({
          lat: prev.lat + (order.delivery_lat - prev.lat) * 0.1,
          lng: prev.lng + (order.delivery_lng - prev.lng) * 0.1,
          timestamp: new Date().toISOString(),
        }));
        
        // تحديث الوقت المتبقي
        setEstimatedTime(prev => Math.max(0, prev - 1));
      }, 5000); // كل 5 ثواني

      return () => clearInterval(interval);
    }
  }, [order?.status, order?.delivery_lat, order?.delivery_lng]);

  const statuses: OrderStatus[] = order?.delivery_type === 'scheduled'
    ? [
        { status: 'pending', label: 'تم الطلب', icon: '📝', completed: true },
        { status: 'processing', label: 'قيد التحضير', icon: '📦', completed: ['processing', 'ready_for_pickup', 'batch_assigned', 'shipped', 'out_for_delivery', 'delivered'].includes(order?.status) },
        { status: 'ready_for_pickup', label: 'جاهز للاستلام', icon: '✅', completed: ['ready_for_pickup', 'batch_assigned', 'shipped', 'out_for_delivery', 'delivered'].includes(order?.status) },
        { status: 'batch_assigned', label: 'تم إضافته للبكج', icon: '📦', completed: ['batch_assigned', 'shipped', 'out_for_delivery', 'delivered'].includes(order?.status) },
        { status: 'shipped', label: 'قيد التوصيل', icon: '🚚', completed: ['shipped', 'out_for_delivery', 'delivered'].includes(order?.status) },
        { status: 'delivered', label: 'تم التوصيل', icon: '🎉', completed: order?.status === 'delivered' },
      ]
    : [
        { status: 'pending', label: 'تم الطلب', icon: '📝', completed: true },
        { status: 'processing', label: 'قيد التحضير', icon: '📦', completed: ['processing', 'ready_for_pickup', 'shipped', 'out_for_delivery', 'delivered'].includes(order?.status) },
        { status: 'ready_for_pickup', label: 'جاهز للشحن', icon: '✅', completed: ['ready_for_pickup', 'shipped', 'out_for_delivery', 'delivered'].includes(order?.status) },
        { status: 'shipped', label: 'قيد التوصيل', icon: '🚚', completed: ['shipped', 'out_for_delivery', 'delivered'].includes(order?.status) },
        { status: 'delivered', label: 'تم التوصيل', icon: '🎉', completed: order?.status === 'delivered' },
      ];

  const getCurrentStatusIndex = () => {
    return statuses.findIndex(s => s.status === order?.status);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-xl text-gray-600">جاري تحميل تفاصيل الطلب...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <p className="text-6xl mb-4">❌</p>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">الطلب غير موجود</h1>
            <button 
              onClick={() => router.push('/orders')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              العودة للطلبات
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-4 md:py-8">
        <div className="max-w-4xl mx-auto px-4" dir="rtl">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-4 md:mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
                  تتبع الطلب
                </h1>
                <p className="text-gray-600">رقم الطلب: <span className="font-bold text-indigo-600">{order.order_number}</span></p>
              </div>
              <div className="flex flex-col items-start md:items-end gap-1">
                <span className="text-sm text-gray-600">تاريخ الطلب</span>
                <span className="font-semibold text-gray-800">
                  {new Date(order.created_at).toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>

        {/* Status Timeline - Responsive */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-8 mb-4 md:mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 md:mb-8">حالة الطلب</h2>
          
          {/* Desktop Timeline */}
          <div className="hidden md:block">
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-10 left-0 right-0 h-1 bg-gray-200">
                <div 
                  className="h-full bg-green-600 transition-all duration-500"
                  style={{ width: `${(getCurrentStatusIndex() / (statuses.length - 1)) * 100}%` }}
                ></div>
              </div>

              {/* Status Steps */}
              <div className="relative flex justify-between">
                {statuses.map((status, index) => (
                  <div key={status.status} className="flex flex-col items-center">
                    <div
                      className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl mb-3 transition-all ${
                        status.completed
                          ? 'bg-green-600 text-white shadow-lg'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {status.icon}
                    </div>
                    <p className={`text-sm font-semibold text-center ${
                      status.completed ? 'text-gray-800' : 'text-gray-500'
                    }`}>
                      {status.label}
                    </p>
                    {status.completed && (
                      <p className="text-xs text-gray-500 mt-1">
                      {index === 0 && new Date(order.created_at).toLocaleDateString('ar-SA')}
                        {index === getCurrentStatusIndex() && order.status !== 'delivered' && 'الآن'}
                        {status.status === 'delivered' && order.status === 'delivered' && 'مكتمل'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Timeline */}
          <div className="md:hidden space-y-4">
            {statuses.map((status, index) => (
              <div key={status.status} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                      status.completed
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {status.icon}
                  </div>
                  {index < statuses.length - 1 && (
                    <div className={`w-1 h-12 ${
                      statuses[index + 1].completed ? 'bg-green-600' : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>
                <div className="flex-1 pt-2">
                  <p className={`font-semibold ${
                    status.completed ? 'text-gray-800' : 'text-gray-500'
                  }`}>
                    {status.label}
                  </p>
                  {status.completed && (
                    <p className="text-xs text-gray-500 mt-1">
                      {index === 0 && new Date(order.created_at).toLocaleDateString('ar-SA')}
                      {index === getCurrentStatusIndex() && order.status !== 'delivered' && 'جاري التنفيذ الآن'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Estimated Delivery */}
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <div className="mt-6 md:mt-8 space-y-3">
              {/* Delivery Type Badge */}
              <div className="flex items-center justify-center gap-2">
                <span className={`px-4 py-2 rounded-lg font-bold text-sm ${
                  order.delivery_type === 'instant' 
                    ? 'bg-orange-100 text-orange-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {order.delivery_type === 'instant' ? '⚡ توصيل فوري' : '📦 توصيل مجدول'}
                </span>
              </div>

              {/* Batch Info for Scheduled Orders */}
              {order.delivery_type === 'scheduled' && order.delivery_batches && (
                <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-cyan-600" />
                    <p className="font-bold text-cyan-800">
                      بكج التوصيل: {order.delivery_batches.batch_number}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-cyan-600" />
                    <p className="text-cyan-700">
                      التاريخ المتوقع: {new Date(order.delivery_batches.scheduled_date).toLocaleDateString('ar-SA', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Estimated Delivery Time */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  ⏰ التوصيل المتوقع: <span className="font-bold">
                    {order.delivery_type === 'instant' 
                      ? '30-45 دقيقة' 
                      : order.delivery_batches?.estimated_delivery || order.estimated_delivery}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Driver Info - Only show when shipped */}
        {order.status === 'shipped' && order.driver_name && (
          <>
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-4 md:mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">معلومات المندوب</h3>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                  🚗
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{order.driver_name}</p>
                  <p className="text-sm text-gray-600">{order.driver_phone}</p>
                </div>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm md:text-base">
                  📞 اتصال
                </button>
              </div>

              {/* Estimated Time */}
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">الوقت المتبقي للوصول</p>
                    <p className="text-2xl font-bold text-blue-600">{estimatedTime} دقيقة</p>
                  </div>
                  <span className="text-4xl animate-pulse">⏱️</span>
                </div>
              </div>
            </div>

            {/* Live Map */}
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-4 md:mb-6 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">📍 تتبع المندوب مباشر</h3>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold animate-pulse">
                  🔴 مباشر
                </span>
              </div>

              {/* Map Container */}
              <div className="relative bg-gradient-to-br from-blue-100 via-green-50 to-blue-100 rounded-xl overflow-hidden border-2 border-blue-200">
                {/* Simulated Map */}
                <div className="h-96 relative">
                  {/* Grid Pattern */}
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: 'linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }} />

                  {/* Driver Location (animated) */}
                  <div 
                    className="absolute transition-all duration-5000 ease-linear"
                    style={{
                      left: `${((driverLocation.lng - 35.9) / 0.05) * 100}%`,
                      top: `${((31.97 - driverLocation.lat) / 0.03) * 100}%`,
                    }}
                  >
                    <div className="relative">
                      {/* Pulse Effect */}
                      <div className="absolute -inset-4 bg-blue-400 rounded-full animate-ping opacity-75" />
                      {/* Driver Icon */}
                      <div className="relative w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-2xl shadow-lg border-4 border-white">
                        🚗
                      </div>
                      {/* Driver Name */}
                      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-lg shadow-lg whitespace-nowrap text-xs font-bold border-2 border-blue-200">
                        {order.driver_name}
                      </div>
                    </div>
                  </div>

                  {/* Destination Location */}
                  <div 
                    className="absolute"
                    style={{
                      left: `${((order.delivery_lng - 35.9) / 0.05) * 100}%`,
                      top: `${((31.97 - order.delivery_lat) / 0.03) * 100}%`,
                    }}
                  >
                    <div className="relative">
                      {/* Pulse Effect */}
                      <div className="absolute -inset-4 bg-red-400 rounded-full animate-pulse" />
                      {/* Destination Icon */}
                      <div className="relative w-12 h-12 bg-gradient-to-r from-red-500 to-orange-600 rounded-full flex items-center justify-center text-2xl shadow-lg border-4 border-white">
                        🏠
                      </div>
                      {/* Address Label */}
                      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-lg shadow-lg whitespace-nowrap text-xs font-bold border-2 border-red-200">
                        عنوانك
                      </div>
                    </div>
                  </div>

                  {/* Route Line */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <line
                      x1={`${((driverLocation.lng - 35.9) / 0.05) * 100}%`}
                      y1={`${((31.97 - driverLocation.lat) / 0.03) * 100}%`}
                      x2={`${((order.delivery_lng - 35.9) / 0.05) * 100}%`}
                      y2={`${((31.97 - order.delivery_lat) / 0.03) * 100}%`}
                      stroke="#3B82F6"
                      strokeWidth="3"
                      strokeDasharray="10,5"
                      className="animate-pulse"
                    />
                  </svg>

                  {/* Map Controls */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors">
                      ➕
                    </button>
                    <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors">
                      ➖
                    </button>
                  </div>

                  {/* Open in Maps Button */}
                  <button 
                    onClick={() => { if (typeof window !== 'undefined') window.open(`https://www.google.com/maps/search/?api=1&query=${order.delivery_lat},${order.delivery_lng}`, '_blank'); }}
                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    🗺️ فتح في خرائط Google
                  </button>
                </div>

                {/* Map Legend */}
                <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-4 border-t-2 border-blue-200">
                  <div className="flex items-center justify-around text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-lg">
                        🚗
                      </span>
                      <span className="font-bold text-slate-700">المندوب</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-600 rounded-full flex items-center justify-center text-lg">
                        🏠
                      </span>
                      <span className="font-bold text-slate-700">وجهتك</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-1 bg-blue-500" />
                      <span className="font-bold text-slate-700">المسار</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Last Update */}
              <p className="text-xs text-slate-500 mt-3 text-center">
                آخر تحديث: {new Date(driverLocation.timestamp).toLocaleTimeString('ar-SA')}
              </p>
            </div>
          </>
        )}

        {/* Delivery Address */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-4 md:mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">عنوان التوصيل</h3>
          <div className="flex items-start gap-3">
            <span className="text-2xl">📍</span>
            <div>
              <p className="text-gray-600 mt-2">{order.delivery_address}</p>
              {order.delivery_notes && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">ملاحظات:</p>
                  <p className="text-gray-700">{order.delivery_notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Items - Responsive Grid */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-4 md:mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">المنتجات ({order.items?.length || 0})</h3>
          
          {order.stores && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg flex items-center gap-3">
              <span className="text-2xl">🏪</span>
              <div>
                <p className="text-sm text-gray-600">المتجر</p>
                <p className="font-bold text-gray-800">
                  {order.stores.shop_name_ar || order.stores.shop_name}
                </p>
                {order.stores.phone && (
                  <p className="text-sm text-gray-600">{order.stores.phone}</p>
                )}
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0">
                {item.product_image && (
                  <img
                    src={item.product_image}
                    alt={item.name_ar || item.name}
                    className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-800">{item.name_ar || item.name}</h4>
                  <p className="text-sm text-gray-600">{item.product_name_ar || item.product_name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-600">الكمية: {item.quantity}</span>
                    <span className="font-bold text-green-600">{formatPrice(item.total)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>المجموع الفرعي:</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>رسوم التوصيل:</span>
              <span>{formatPrice(order.delivery_fee)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>الضريبة:</span>
              <span>{formatPrice(order.tax)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>الخصم:</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t border-gray-200">
              <span>المجموع الكلي:</span>
              <span className="text-green-600">{formatPrice(order.total)}</span>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">طريقة الدفع</span>
                <span className="font-bold text-gray-800">
                  {order.payment_method === 'cash' ? '💵 نقداً عند الاستلام' : '💳 بطاقة ائتمانية'}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600">حالة الدفع</span>
                <span className={`font-bold ${order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {order.payment_status === 'paid' ? '✅ مدفوع' : '⏳ غير مدفوع'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions - Responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4">
          <button 
            onClick={() => router.push('/orders')}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            ← العودة للطلبات
          </button>
          <button 
            onClick={downloadInvoice}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
          >
            📄 تحميل الفاتورة
          </button>
        </div>

        {/* Pickup Order Button - Customer */}
        {order.status === 'picked_up' && (
          <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-xl p-4 md:p-6 text-center">
            <p className="text-lg font-semibold text-blue-800 mb-4">
              🚚 السائق في الطريق إليك!
            </p>
            <button 
              onClick={() => router.push(`/orders/${params.id}/delivery-scan`)}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 mx-auto"
            >
              📸 استلام الطلب (مسح QR أو إدخال OTP)
            </button>
          </div>
        )}

        {/* Delivered - Review Button */}
        {order.status === 'delivered' && (
          <div className="mt-4 bg-green-50 border-2 border-green-200 rounded-xl p-4 md:p-6 text-center">
            <p className="text-lg font-semibold text-green-800 mb-4">
              🎉 تم توصيل طلبك بنجاح!
            </p>
            <button 
              onClick={reviewOrder}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              ⭐ تقييم الطلب والبائع
            </button>
          </div>
        )}
      </div>
    </div>
    <Footer />
    </>
  );
}
