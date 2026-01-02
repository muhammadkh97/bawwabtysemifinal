'use client';

import { useState, useEffect } from 'react';

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
  // سيتم جلب البيانات من Supabase
  const [order] = useState<any>({
    subtotal: 500,
    delivery_fee: 5,
    tax: 80,
    total: 585,
  });

  const [driverLocation, setDriverLocation] = useState<DriverLocation>({
    lat: 31.9454,
    lng: 35.9284,
    timestamp: new Date().toISOString(),
  });

  const [estimatedTime, setEstimatedTime] = useState(15); // دقائق

  // محاكاة تحديث موقع المندوب Real-time
  useEffect(() => {
    if (order.status === 'shipped') {
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
  }, [order.status]);

  const statuses: OrderStatus[] = [
    { status: 'pending', label: 'تم الطلب', icon: '📝', completed: true },
    { status: 'processing', label: 'قيد التجهيز', icon: '📦', completed: true },
    { status: 'ready', label: 'جاهز للشحن', icon: '✅', completed: true },
    { status: 'shipped', label: 'قيد التوصيل', icon: '🚚', completed: order.status === 'shipped' || order.status === 'delivered' },
    { status: 'delivered', label: 'تم التوصيل', icon: '🎉', completed: order.status === 'delivered' },
  ];

  const getCurrentStatusIndex = () => {
    return statuses.findIndex(s => s.status === order.status);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="max-w-4xl mx-auto px-4">
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
              <span className="font-semibold text-gray-800">{order.created_at}</span>
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
                        {index === 0 && order.created_at}
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
                      {index === 0 && order.created_at}
                      {index === getCurrentStatusIndex() && order.status !== 'delivered' && 'جاري التنفيذ الآن'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Estimated Delivery */}
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <div className="mt-6 md:mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                ⏰ التوصيل المتوقع: <span className="font-bold">{order.estimated_delivery}</span>
              </p>
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
                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${order.delivery_lat},${order.delivery_lng}`, '_blank')}
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
              <p className="font-medium text-gray-800">{order.customer_name}</p>
              <p className="text-gray-600">{order.customer_phone}</p>
              <p className="text-gray-600 mt-2">{order.delivery_address}</p>
            </div>
          </div>
        </div>

        {/* Order Items - Responsive Grid */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-4 md:mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">المنتجات</h3>
          
          <div className="space-y-4">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-lg flex items-center justify-center text-3xl md:text-4xl flex-shrink-0">
                  {item.product_image}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-800 truncate">{item.product_name}</h4>
                  <p className="text-sm text-gray-600">{item.vendor_name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-600">الكمية: {item.quantity}</span>
                    <span className="font-bold text-green-600">{item.price * item.quantity} د.أ</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>المجموع الفرعي:</span>
              <span>{order.subtotal} د.أ</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>رسوم التوصيل:</span>
              <span>{order.delivery_fee} د.أ</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>الضريبة (16%):</span>
              <span>{order.tax} د.أ</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t border-gray-200">
              <span>المجموع الكلي:</span>
              <span className="text-green-600">{order.total} د.أ</span>
            </div>
          </div>
        </div>

        {/* Actions - Responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <button className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
            💬 تواصل مع البائع
          </button>
          <button className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
            📄 تحميل الفاتورة
          </button>
        </div>

        {/* Delivered - Review Button */}
        {order.status === 'delivered' && (
          <div className="mt-4 bg-green-50 border-2 border-green-200 rounded-xl p-4 md:p-6 text-center">
            <p className="text-lg font-semibold text-green-800 mb-4">
              🎉 تم توصيل طلبك بنجاح!
            </p>
            <button className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
              ⭐ تقييم الطلب والبائع
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
