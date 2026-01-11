'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from 'lucide-react';
import { logger } from '@/lib/logger';

// Google Maps Types
declare global {
  interface Window {
    google: typeof google;
  }
}

interface GoogleMapComponentProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    position: { lat: number; lng: number };
    title: string;
    type: 'pickup' | 'delivery' | 'current';
  }>;
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
  showCurrentLocation?: boolean;
  height?: string;
}

export default function GoogleMapComponent({
  center = { lat: 31.9522, lng: 35.2332 }, // القدس كموقع افتراضي
  zoom = 13,
  markers = [],
  onLocationUpdate,
  showCurrentLocation = true,
  height = '500px',
}: GoogleMapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const currentLocationMarkerRef = useRef<google.maps.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // تحميل Google Maps API
  useEffect(() => {
    const loadGoogleMapsScript = () => {
      // التحقق من وجود Google Maps مسبقاً
      if (window.google && window.google.maps) {
        setIsLoading(false);
        return;
      }

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        logger.error('Google Maps API key missing', {
          error: 'Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable',
          component: 'GoogleMapComponent',
        })
        setIsLoading(false);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=ar`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        setIsLoading(false);
      };
      
      script.onerror = () => {
        setError('فشل تحميل خرائط Google. يرجى التحقق من مفتاح API.');
        setIsLoading(false);
      };

      document.head.appendChild(script);
    };

    loadGoogleMapsScript();
  }, []);

  // إنشاء الخريطة
  useEffect(() => {
    if (!isLoading && !error && mapRef.current && window.google) {
      googleMapRef.current = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
      });

      // إضافة الموقع الحالي إذا كان مفعلاً
      if (showCurrentLocation && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const currentPos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };

            if (googleMapRef.current) {
              googleMapRef.current.setCenter(currentPos);

              // إضافة علامة للموقع الحالي
              currentLocationMarkerRef.current = new google.maps.Marker({
                position: currentPos,
                map: googleMapRef.current,
                title: 'موقعك الحالي',
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: '#4285F4',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 3,
                },
                animation: google.maps.Animation.DROP,
              });

              // دائرة الدقة
              new google.maps.Circle({
                strokeColor: '#4285F4',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#4285F4',
                fillOpacity: 0.2,
                map: googleMapRef.current,
                center: currentPos,
                radius: position.coords.accuracy,
              });

              if (onLocationUpdate) {
                onLocationUpdate(currentPos);
              }
            }
          },
          (error) => {
            logger.error('getCurrentPosition failed', {
              error: error.message || 'خطأ في الحصول على الموقع',
              component: 'GoogleMapComponent',
              errorCode: error.code,
            })
          }
        );

        // تتبع الموقع المباشر
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const newPos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };

            if (currentLocationMarkerRef.current) {
              currentLocationMarkerRef.current.setPosition(newPos);
            }

            if (onLocationUpdate) {
              onLocationUpdate(newPos);
            }
          },
          (error) => {
            logger.error('watchPosition failed', {
              error: error.message || 'خطأ في تتبع الموقع',
              component: 'GoogleMapComponent',
              errorCode: error.code,
            })
          },
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );

        return () => {
          navigator.geolocation.clearWatch(watchId);
        };
      }
    }
  }, [isLoading, error, center, zoom, showCurrentLocation, onLocationUpdate]);

  // إضافة العلامات
  useEffect(() => {
    if (!googleMapRef.current || !window.google) return;

    // حذف العلامات القديمة
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // إضافة العلامات الجديدة
    markers.forEach((markerData) => {
      let icon: google.maps.Icon | undefined;

      // تخصيص الأيقونة حسب النوع
      if (markerData.type === 'pickup') {
        icon = {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          `),
          scaledSize: new google.maps.Size(40, 40),
        };
      } else if (markerData.type === 'delivery') {
        icon = {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          `),
          scaledSize: new google.maps.Size(40, 40),
        };
      }

      const marker = new google.maps.Marker({
        position: markerData.position,
        map: googleMapRef.current!,
        title: markerData.title,
        icon,
        animation: google.maps.Animation.DROP,
      });

      // إضافة نافذة معلومات
      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="padding: 8px; font-family: Arial, sans-serif; direction: rtl;">
          <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px; font-weight: bold;">${markerData.title}</h3>
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            ${markerData.type === 'pickup' ? '📦 موقع الاستلام' : '🏠 موقع التسليم'}
          </p>
        </div>`,
      });

      marker.addListener('click', () => {
        infoWindow.open(googleMapRef.current!, marker);
      });

      markersRef.current.push(marker);
    });

    // ضبط حدود الخريطة لتشمل جميع العلامات
    if (markers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      markers.forEach((marker) => {
        bounds.extend(marker.position);
      });
      googleMapRef.current.fitBounds(bounds);
    }
  }, [markers]);

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 rounded-xl"
        style={{ height }}
      >
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-2" />
          <p className="text-gray-600">جاري تحميل الخريطة...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center bg-red-50 rounded-xl border-2 border-red-200"
        style={{ height }}
      >
        <div className="text-center p-6">
          <div className="text-red-500 text-4xl mb-2">⚠️</div>
          <p className="text-red-600 font-medium">{error}</p>
          <p className="text-red-500 text-sm mt-2">
            يرجى التأكد من إضافة مفتاح Google Maps API في ملف .env
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="rounded-xl shadow-lg border border-gray-200"
      style={{ height, width: '100%' }}
    />
  );
}
