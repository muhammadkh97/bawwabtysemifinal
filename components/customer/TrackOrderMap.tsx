// components/customer/TrackOrderMap.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/lib/supabase';

// ==========================================
// Types
// ==========================================

interface TrackOrderMapProps {
  orderId: string;
  showDriverLocation?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // بالثواني
}

interface OrderTracking {
  order_number: string;
  status: string;
  trip_stage?: string;
  driver_name?: string;
  driver_phone?: string;
  driver_lat?: number;
  driver_lng?: number;
  store_lat: number;
  store_lng: number;
  customer_lat: number;
  customer_lng: number;
  estimated_arrival?: string;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
mapboxgl.accessToken = MAPBOX_TOKEN;

// ==========================================
// Component
// ==========================================

export default function TrackOrderMap({
  orderId,
  showDriverLocation = true,
  autoRefresh = true,
  refreshInterval = 10, // كل 10 ثواني
}: TrackOrderMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [tracking, setTracking] = useState<OrderTracking | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Markers
  const driverMarker = useRef<mapboxgl.Marker | null>(null);
  const storeMarker = useRef<mapboxgl.Marker | null>(null);
  const customerMarker = useRef<mapboxgl.Marker | null>(null);

  // ==========================================
  // جلب بيانات التتبع
  // ==========================================

  const fetchTrackingData = async () => {
    try {
      const { data } = await supabase
        .from('v_orders_with_routing_info')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (data) {
        setTracking({
          order_number: data.order_number,
          status: data.status,
          trip_stage: data.trip_stage,
          driver_name: data.driver_name,
          driver_phone: data.driver_phone,
          driver_lat: data.driver_lat,
          driver_lng: data.driver_lng,
          store_lat: data.store_lat,
          store_lng: data.store_lng,
          customer_lat: data.customer_lat,
          customer_lng: data.customer_lng,
        });
      }
    } catch (error) {
      console.error('خطأ في جلب بيانات التتبع:', error);
    }
  };

  useEffect(() => {
    fetchTrackingData();

    // تحديث تلقائي
    if (autoRefresh) {
      const interval = setInterval(fetchTrackingData, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, autoRefresh, refreshInterval]);

  // ==========================================
  // تهيئة الخريطة
  // ==========================================

  useEffect(() => {
    if (!mapContainer.current || map.current || !tracking) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [tracking.customer_lng, tracking.customer_lat],
      zoom: 13,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
    };
  }, [tracking]);

  // ==========================================
  // تحديث العلامات
  // ==========================================

  useEffect(() => {
    if (!map.current || !mapLoaded || !tracking) return;

    // 🏪 علامة المتجر
    if (!storeMarker.current) {
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          background: linear-gradient(135deg, #ec4899 0%, #f43f5e 100%);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(236, 72, 153, 0.4);
          border: 2px solid white;
        ">
          <span style="font-size: 20px;">🏪</span>
        </div>
      `;

      storeMarker.current = new mapboxgl.Marker({ element: el })
        .setLngLat([tracking.store_lng, tracking.store_lat])
        .setPopup(new mapboxgl.Popup().setHTML('<strong>📍 المتجر</strong>'))
        .addTo(map.current);
    }

    // 🏠 علامة موقع التسليم
    if (!customerMarker.current) {
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          border: 2px solid white;
        ">
          <span style="font-size: 20px;">🏠</span>
        </div>
      `;

      customerMarker.current = new mapboxgl.Marker({ element: el })
        .setLngLat([tracking.customer_lng, tracking.customer_lat])
        .setPopup(new mapboxgl.Popup().setHTML('<strong>📍 موقع التسليم</strong>'))
        .addTo(map.current);
    }

    // 🚗 علامة السائق (إذا كان متاحاً)
    if (showDriverLocation && tracking.driver_lat && tracking.driver_lng) {
      if (driverMarker.current) {
        driverMarker.current.setLngLat([tracking.driver_lng, tracking.driver_lat]);
      } else {
        const el = document.createElement('div');
        el.innerHTML = `
          <div style="
            background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.5);
            border: 3px solid white;
            animation: pulse 2s infinite;
          ">
            <span style="font-size: 24px;">🚗</span>
          </div>
        `;

        driverMarker.current = new mapboxgl.Marker({ element: el })
          .setLngLat([tracking.driver_lng, tracking.driver_lat])
          .setPopup(
            new mapboxgl.Popup().setHTML(`
              <div style="padding: 8px;">
                <strong style="color: #8b5cf6;">🚗 ${tracking.driver_name || 'المندوب'}</strong>
                <p style="font-size: 12px; color: #6B7280; margin-top: 4px;">في الطريق إليك</p>
              </div>
            `)
          )
          .addTo(map.current);
      }

      // تعديل الكاميرا لتشمل جميع النقاط
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([tracking.store_lng, tracking.store_lat]);
      bounds.extend([tracking.customer_lng, tracking.customer_lat]);
      bounds.extend([tracking.driver_lng, tracking.driver_lat]);

      map.current.fitBounds(bounds, {
        padding: 80,
        duration: 1000,
      });
    } else {
      // عرض المتجر والعميل فقط
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([tracking.store_lng, tracking.store_lat]);
      bounds.extend([tracking.customer_lng, tracking.customer_lat]);

      map.current.fitBounds(bounds, {
        padding: 80,
        duration: 1000,
      });
    }
  }, [tracking, mapLoaded, showDriverLocation]);

  // ==========================================
  // حالة الطلب
  // ==========================================

  const getStatusInfo = () => {
    if (!tracking) return { text: 'جاري التحميل...', color: 'gray', icon: '⏳' };

    const statusMap: Record<string, { text: string; color: string; icon: string }> = {
      confirmed: { text: 'تم تأكيد الطلب', color: 'blue', icon: '✅' },
      on_the_way: { text: 'المندوب في الطريق للمتجر', color: 'purple', icon: '🚗' },
      picking_up: { text: 'المندوب في المتجر', color: 'orange', icon: '🏪' },
      out_for_delivery: { text: 'الطلب في الطريق إليك', color: 'blue', icon: '📦' },
      arriving: { text: 'المندوب على وشك الوصول', color: 'green', icon: '📍' },
      delivered: { text: 'تم التسليم بنجاح', color: 'green', icon: '🎉' },
    };

    return statusMap[tracking.status] || { text: tracking.status, color: 'gray', icon: '📋' };
  };

  const statusInfo = getStatusInfo();

  // ==========================================
  // Render
  // ==========================================

  if (!tracking) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">جاري تحميل معلومات الطلب...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* الخريطة */}
      <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden" />

      {/* شريط الحالة */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div
          className={`bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 border-l-4`}
          style={{ borderColor: `var(--color-${statusInfo.color}-500)` }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">{statusInfo.icon}</span>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-800">{statusInfo.text}</h3>
              <p className="text-sm text-gray-500">طلب #{tracking.order_number}</p>
            </div>
            {autoRefresh && (
              <div className="text-center">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <p className="text-xs text-gray-500 mt-1">مباشر</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* معلومات السائق (إذا كان متاحاً) */}
      {tracking.driver_name && tracking.driver_lat && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">المندوب</p>
                <p className="font-bold text-lg">{tracking.driver_name}</p>
              </div>
              {tracking.driver_phone && (
                <a
                  href={`tel:${tracking.driver_phone}`}
                  className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 transition"
                >
                  📞 اتصال
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CSS للتحريك */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}
