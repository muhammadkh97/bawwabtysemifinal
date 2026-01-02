'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import type { DriverOrder, DriverLocation } from '@/types/driver';

// Fix Leaflet default marker icons
if (typeof window !== 'undefined') {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

interface OrdersMapProps {
  orders: DriverOrder[];
  driverLocation: DriverLocation | null;
  onOrderSelect?: (order: DriverOrder) => void;
  selectedOrderId?: string;
}

export default function OrdersMap({
  orders,
  driverLocation,
  onOrderSelect,
  selectedOrderId,
}: OrdersMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const routingControlRef = useRef<any>(null);
  const polylinesRef = useRef<L.Polyline[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: [24.7136, 46.6753], // Riyadh, Saudi Arabia
      zoom: 12,
      zoomControl: true,
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Clear existing markers and routes
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};
    
    polylinesRef.current.forEach((polyline: L.Polyline) => polyline.remove());
    polylinesRef.current = [];

    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    // Create custom icons
    const storeIcon = L.divIcon({
      html: `<div style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); width: 40px; height: 40px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);">
        <svg style="width: 20px; height: 20px; transform: rotate(45deg); fill: white;" viewBox="0 0 24 24">
          <path d="M20 7h-4V5l-2-2h-4L8 5v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM10 5h4v2h-4V5zm10 15H4V9h16v11z"/>
        </svg>
      </div>`,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });

    const customerIcon = L.divIcon({
      html: `<div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); width: 40px; height: 40px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.5);">
        <svg style="width: 20px; height: 20px; transform: rotate(45deg); fill: white;" viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      </div>`,
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });

    const driverIcon = L.divIcon({
      html: `<div style="background: linear-gradient(135deg, #A855F7 0%, #9333EA 100%); width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 4px solid white; box-shadow: 0 4px 16px rgba(168, 85, 247, 0.6); animation: pulse 2s ease-in-out infinite;">
        <svg style="width: 24px; height: 24px; fill: white;" viewBox="0 0 24 24">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
        </svg>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      </style>`,
      className: '',
      iconSize: [50, 50],
      iconAnchor: [25, 25],
    });

    // Add driver location marker
    if (driverLocation) {
      const driverMarker = L.marker([driverLocation.lat, driverLocation.lng], {
        icon: driverIcon,
        zIndexOffset: 1000,
      }).addTo(map);

      driverMarker.bindPopup(`
        <div style="padding: 8px; min-width: 150px;">
          <div style="font-weight: bold; color: #A855F7; margin-bottom: 4px; font-size: 14px;">📍 موقعك الحالي</div>
          <div style="color: #6B7280; font-size: 12px;">
            ${driverLocation.lat.toFixed(6)}°, ${driverLocation.lng.toFixed(6)}°
          </div>
        </div>
      `);

      markersRef.current['driver'] = driverMarker;
    }

    // Add order markers and routes
    const bounds: [number, number][] = [];

    orders.forEach((order) => {
      if (
        !order.vendor.store_latitude ||
        !order.vendor.store_longitude ||
        !order.delivery_latitude ||
        !order.delivery_longitude
      ) {
        return;
      }

      const storeLatLng: [number, number] = [
        order.vendor.store_latitude,
        order.vendor.store_longitude,
      ];
      const customerLatLng: [number, number] = [
        order.delivery_latitude,
        order.delivery_longitude,
      ];

      bounds.push(storeLatLng);
      bounds.push(customerLatLng);

      // Status colors
      const statusColors: Record<string, string> = {
        confirmed: '#3B82F6',
        preparing: '#F59E0B',
        ready: '#10B981',
        picked_up: '#A855F7',
      };
      const routeColor = statusColors[order.status] || '#6B7280';

      // Draw route line
      const polyline = L.polyline([storeLatLng, customerLatLng], {
        color: routeColor,
        weight: 4,
        opacity: selectedOrderId === order.id ? 1 : 0.5,
        dashArray: selectedOrderId === order.id ? '' : '10, 10',
      }).addTo(map);

      // Add arrow decoration
      const decorator = L.polylineDecorator(polyline, {
        patterns: [
          {
            offset: '50%',
            repeat: 0,
            symbol: L.Symbol.arrowHead({
              pixelSize: 15,
              polygon: false,
              pathOptions: {
                stroke: true,
                weight: 3,
                color: routeColor,
              },
            }),
          },
        ],
      }).addTo(map);

      polylinesRef.current.push(polyline);

      // Store marker
      const storeMarker = L.marker(storeLatLng, {
        icon: storeIcon,
        zIndexOffset: selectedOrderId === order.id ? 500 : 100,
      }).addTo(map);

      storeMarker.bindPopup(`
        <div style="padding: 12px; min-width: 250px;">
          <div style="font-weight: bold; color: #3B82F6; margin-bottom: 8px; font-size: 16px;">🏪 ${order.vendor.store_name}</div>
          <div style="color: #6B7280; margin-bottom: 8px; font-size: 13px;">${order.vendor.store_address || 'عنوان المتجر'}</div>
          <div style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: white; padding: 6px 12px; border-radius: 8px; text-align: center; font-weight: bold; margin-top: 8px;">
            نقطة الاستلام
          </div>
        </div>
      `);

      storeMarker.on('click', () => {
        if (onOrderSelect) onOrderSelect(order);
      });

      markersRef.current[`store-${order.id}`] = storeMarker;

      // Customer marker
      const customerMarker = L.marker(customerLatLng, {
        icon: customerIcon,
        zIndexOffset: selectedOrderId === order.id ? 500 : 100,
      }).addTo(map);

      customerMarker.bindPopup(`
        <div style="padding: 12px; min-width: 250px;">
          <div style="font-weight: bold; color: #10B981; margin-bottom: 8px; font-size: 16px;">👤 ${order.customer.name}</div>
          <div style="color: #6B7280; margin-bottom: 4px; font-size: 13px;">${order.delivery_address || 'عنوان التسليم'}</div>
          <div style="background: #F3F4F6; padding: 8px; border-radius: 8px; margin-top: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #6B7280; font-size: 12px;">رقم الطلب:</span>
              <span style="color: #111827; font-weight: bold; font-size: 12px;">#${order.order_number}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #6B7280; font-size: 12px;">القيمة:</span>
              <span style="color: #10B981; font-weight: bold; font-size: 12px;">${order.total} ر.س</span>
            </div>
          </div>
          <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 6px 12px; border-radius: 8px; text-align: center; font-weight: bold; margin-top: 8px;">
            نقطة التسليم
          </div>
        </div>
      `);

      customerMarker.on('click', () => {
        if (onOrderSelect) onOrderSelect(order);
      });

      markersRef.current[`customer-${order.id}`] = customerMarker;

      // Highlight selected order
      if (selectedOrderId === order.id) {
        polyline.setStyle({ opacity: 1, weight: 6, dashArray: '' });
        storeMarker.openPopup();
      }
    });

    // Fit map to show all markers
    if (bounds.length > 0) {
      if (driverLocation) {
        bounds.push([driverLocation.lat, driverLocation.lng]);
      }
      // @ts-ignore
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [orders, driverLocation, selectedOrderId, onOrderSelect]);

  return <div ref={mapContainerRef} className="w-full h-full" />;
}
