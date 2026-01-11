// components/delivery/DeliveryMapbox.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { toast } from 'react-hot-toast';
import { logger } from '@/lib/logger';

// ==========================================
// Types
// ==========================================

export interface MapLocation {
  lat: number;
  lng: number;
}

export interface DeliveryMapboxProps {
  orderId: string;
  driverLocation: MapLocation;
  storeLocation: MapLocation;
  customerLocation: MapLocation;
  storeName?: string;
  customerName?: string;
  tripStage: 'heading_to_store' | 'at_store' | 'heading_to_customer' | 'at_customer' | 'completed';
  onStageChange?: (newStage: string) => void;
  showControls?: boolean;
}

// ==========================================
// Mapbox Access Token
// ==========================================

// احصل على مفتاح API من: https://account.mapbox.com/
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'YOUR_MAPBOX_TOKEN_HERE';

mapboxgl.accessToken = MAPBOX_TOKEN;

// ==========================================
// Component
// ==========================================

export default function DeliveryMapbox({
  orderId,
  driverLocation,
  storeLocation,
  customerLocation,
  storeName = 'المتجر',
  customerName = 'العميل',
  tripStage,
  onStageChange,
  showControls = false,
}: DeliveryMapboxProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [routeDistance, setRouteDistance] = useState<number>(0);
  const [routeDuration, setRouteDuration] = useState<number>(0);

  // Markers refs
  const driverMarker = useRef<mapboxgl.Marker | null>(null);
  const storeMarker = useRef<mapboxgl.Marker | null>(null);
  const customerMarker = useRef<mapboxgl.Marker | null>(null);

  // ==========================================
  // Initialize Map
  // ==========================================

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // تحقق من توفر Mapbox Token
    if (!MAPBOX_TOKEN || MAPBOX_TOKEN === 'YOUR_MAPBOX_TOKEN_HERE') {
      toast.error('يجب إضافة Mapbox Access Token في ملف .env.local');
      return;
    }

    // إنشاء الخريطة
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/navigation-night-v1', // نمط ليلي للسائقين
      center: [driverLocation.lng, driverLocation.lat],
      zoom: 13,
      pitch: 45, // زاوية ميل ثلاثية الأبعاد
      bearing: 0,
      antialias: true,
    });

    // إضافة أدوات التحكم
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
      showUserHeading: true,
    }), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // ==========================================
  // Add/Update Markers
  // ==========================================

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // 🚗 Driver Marker (Car Icon)
    if (driverMarker.current) {
      driverMarker.current.setLngLat([driverLocation.lng, driverLocation.lat]);
    } else {
      const el = document.createElement('div');
      el.className = 'driver-marker';
      el.innerHTML = `
        <div style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.5);
          border: 3px solid white;
          cursor: pointer;
        ">
          <span style="font-size: 24px;">🚗</span>
        </div>
      `;

      driverMarker.current = new mapboxgl.Marker({ element: el })
        .setLngLat([driverLocation.lng, driverLocation.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px; text-align: center;">
              <strong style="color: #667eea;">📍 موقعك الحالي</strong>
            </div>
          `)
        )
        .addTo(map.current);
    }

    // 🏪 Store Marker (Shop Icon)
    if (!storeMarker.current) {
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          width: 45px;
          height: 45px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(245, 87, 108, 0.5);
          border: 3px solid white;
          cursor: pointer;
        ">
          <span style="font-size: 22px;">🏪</span>
        </div>
      `;

      storeMarker.current = new mapboxgl.Marker({ element: el })
        .setLngLat([storeLocation.lng, storeLocation.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px; text-align: center;">
              <strong style="color: #f5576c;">🏪 ${storeName}</strong>
              <p style="margin: 4px 0; font-size: 12px; color: #6B7280;">نقطة الاستلام</p>
            </div>
          `)
        )
        .addTo(map.current);
    }

    // 🏠 Customer Marker (House Icon)
    if (!customerMarker.current) {
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          width: 45px;
          height: 45px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(79, 172, 254, 0.5);
          border: 3px solid white;
          cursor: pointer;
        ">
          <span style="font-size: 22px;">🏠</span>
        </div>
      `;

      customerMarker.current = new mapboxgl.Marker({ element: el })
        .setLngLat([customerLocation.lng, customerLocation.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px; text-align: center;">
              <strong style="color: #4facfe;">🏠 ${customerName}</strong>
              <p style="margin: 4px 0; font-size: 12px; color: #6B7280;">نقطة التسليم</p>
            </div>
          `)
        )
        .addTo(map.current);
    }
  }, [mapLoaded, driverLocation, storeLocation, customerLocation]);

  // ==========================================
  // Draw Route (Mapbox Directions API)
  // ==========================================

  const drawRoute = async (start: MapLocation, end: MapLocation, routeColor: string) => {
    if (!map.current) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}?` +
          new URLSearchParams({
            geometries: 'geojson',
            overview: 'full',
            steps: 'true',
            access_token: MAPBOX_TOKEN,
          })
      );

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const geometry = route.geometry;

        // حفظ معلومات المسار
        setRouteDistance(route.distance / 1000); // تحويل لكيلومتر
        setRouteDuration(route.duration / 60); // تحويل لدقائق

        // حذف المسار القديم إذا كان موجوداً
        if (map.current.getSource('route')) {
          map.current.removeLayer('route');
          map.current.removeSource('route');
        }

        // إضافة المسار الجديد
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: geometry,
          },
        });

        map.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': routeColor,
            'line-width': 6,
            'line-opacity': 0.8,
          },
        });

        // تعديل الكاميرا لعرض المسار كاملاً
        const coordinates = geometry.coordinates;
        const bounds = coordinates.reduce(
          (bounds: mapboxgl.LngLatBounds, coord: [number, number]) => {
            return bounds.extend(coord as [number, number]);
          },
          new mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
        );

        map.current.fitBounds(bounds, {
          padding: 80,
          duration: 1000,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'خطأ في رسم المسار'
      
      logger.error('drawRoute failed', {
        error: errorMessage,
        component: 'DeliveryMapbox',
        orderId,
      })
      toast.error('فشل في رسم المسار على الخريطة');
    }
  };

  // ==========================================
  // Draw Route Based on Trip Stage
  // ==========================================

  useEffect(() => {
    if (!mapLoaded) return;

    // المرحلة A: من السائق إلى المتجر
    if (tripStage === 'heading_to_store') {
      drawRoute(driverLocation, storeLocation, '#f5576c'); // أحمر وردي
    }

    // المرحلة B: من المتجر إلى العميل
    if (tripStage === 'heading_to_customer') {
      drawRoute(storeLocation, customerLocation, '#4facfe'); // أزرق
    }
  }, [tripStage, mapLoaded]);

  // ==========================================
  // Render
  // ==========================================

  return (
    <div className="relative w-full h-full">
      {/* الخريطة */}
      <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden" />

      {/* معلومات المسار */}
      {routeDistance > 0 && (
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 z-10">
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-xs text-gray-500">المسافة</p>
              <p className="text-lg font-bold text-purple-600">
                {routeDistance.toFixed(1)} كم
              </p>
            </div>
            <div className="h-8 w-px bg-gray-300" />
            <div className="text-center">
              <p className="text-xs text-gray-500">الوقت المتوقع</p>
              <p className="text-lg font-bold text-blue-600">
                {Math.ceil(routeDuration)} دقيقة
              </p>
            </div>
          </div>
        </div>
      )}

      {/* أزرار التحكم (اختيارية) */}
      {showControls && (
        <div className="absolute bottom-4 left-4 right-4 z-10 flex gap-2">
          {tripStage === 'heading_to_store' && (
            <button
              onClick={() => onStageChange?.('at_store')}
              className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 px-4 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all"
            >
              ✅ وصلت للمتجر
            </button>
          )}

          {tripStage === 'at_store' && (
            <button
              onClick={() => onStageChange?.('heading_to_customer')}
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 px-4 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all"
            >
              🚀 غادرت المتجر
            </button>
          )}

          {tripStage === 'heading_to_customer' && (
            <button
              onClick={() => onStageChange?.('at_customer')}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-4 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all"
            >
              📍 وصلت للعميل
            </button>
          )}
        </div>
      )}
    </div>
  );
}
