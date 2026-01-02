'use client';

import { useEffect, useRef } from 'react';
import { DriverOrder } from '@/types';

// Dynamically import Leaflet only on client side
let L: any;
if (typeof window !== 'undefined') {
  L = require('leaflet');
  require('leaflet/dist/leaflet.css');
  
  // Fix for default marker icon in Next.js
  if (L.Icon && L.Icon.Default) {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }
}

interface OrdersMapComponentProps {
  orders: DriverOrder[];
  driverLocation: { lat: number; lng: number };
  selectedOrder?: DriverOrder | null;
  onSelectOrder?: (order: DriverOrder | null) => void;
}

export default function OrdersMapComponent({
  orders,
  driverLocation,
  selectedOrder,
  onSelectOrder,
}: OrdersMapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<{ [key: string]: any }>({});
  const driverMarker = useRef<any>(null);
  const routeLines = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainer.current || map.current || !L) return;

    // Create map
    map.current = L.map(mapContainer.current).setView(
      [driverLocation.lat, driverLocation.lng],
      13
    );

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map.current);

    // Add driver marker
    const driverIcon = L.divIcon({
      html: `<div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-size: 24px; animation: pulse 2s infinite;">🚗</div>`,
      className: 'custom-marker',
      iconSize: [50, 50],
      iconAnchor: [25, 25],
    });

    driverMarker.current = L.marker([driverLocation.lat, driverLocation.lng], {
      icon: driverIcon,
    })
      .addTo(map.current!)
      .bindPopup(
        `<div class="text-center font-bold"><div class="text-blue-600 text-lg">🚗 موقعك الحالي</div><div class="text-xs text-gray-500 mt-1">${driverLocation.lat.toFixed(6)}, ${driverLocation.lng.toFixed(6)}</div></div>`
      );

    return () => {
      // Cleanup on component unmount
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update map when orders or selectedOrder changes
  useEffect(() => {
    if (!map.current) return;

    // Remove old markers
    Object.values(markers.current).forEach((marker) => marker.remove());
    Object.values(routeLines.current).forEach((line) => line.remove());
    markers.current = {};
    routeLines.current = {};

    // Add markers for each order
    orders.forEach((order) => {
      const lat = order.delivery_latitude;
      const lng = order.delivery_longitude;

      if (!lat || !lng) return;

      const isSelected = selectedOrder?.id === order.id;
      const statusColors: { [key: string]: string } = {
        confirmed: '#fbbf24',
        preparing: '#60a5fa',
        ready: '#a78bfa',
        out_for_delivery: '#818cf8',
        delivered: '#34d399',
      };

      const bgColor = statusColors[order.status] || '#9ca3af';

      // Create custom icon for order
      const orderIcon = L.divIcon({
        html: `<div style="background: ${bgColor}; width: ${isSelected ? '50' : '40'}px; height: ${isSelected ? '50' : '40'}px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: ${isSelected ? '4' : '3'}px solid white; box-shadow: 0 ${isSelected ? '4' : '2'}px ${isSelected ? '12' : '8'}px rgba(0,0,0,0.3); font-size: ${isSelected ? '22' : '20'}px; transition: all 0.3s ease; cursor: pointer;">📦</div>`,
        className: 'custom-marker',
        iconSize: [isSelected ? 50 : 40, isSelected ? 50 : 40],
        iconAnchor: [isSelected ? 25 : 20, isSelected ? 25 : 20],
      });

      const marker = L.marker([lat, lng], { icon: orderIcon })
        .addTo(map.current!)
        .bindPopup(
          `<div class="text-sm font-bold"><div class="mb-2">#${order.order_number}</div><div class="text-gray-600 text-xs"><div>📍 ${order.delivery_address}</div><div>💰 ${order.total} ر.س</div><div>👤 ${order.customer?.name}</div></div></div>`
        );

      marker.on('click', () => {
        onSelectOrder?.(order);
      });

      markers.current[order.id] = marker;

      // Draw route line from driver to delivery location if selected
      if (isSelected && driverLocation) {
        const routeLine = L.polyline(
          [
            [driverLocation.lat, driverLocation.lng],
            [lat, lng],
          ],
          {
            color: '#3b82f6',
            weight: 2,
            opacity: 0.7,
            dashArray: '5, 5',
          }
        ).addTo(map.current!);

        routeLines.current[order.id] = routeLine;

        // Pan to selected order
        map.current!.fitBounds(
          L.latLngBounds([
            [driverLocation.lat, driverLocation.lng],
            [lat, lng],
          ]),
          { padding: [50, 50] }
        );
      }
    });

    // Update driver location marker
    if (driverMarker.current) {
      driverMarker.current.setLatLng([driverLocation.lat, driverLocation.lng]);
    }
  }, [orders, selectedOrder, driverLocation, onSelectOrder]);

  return (
    <div ref={mapContainer} style={{ width: '100%', height: '100%' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        .custom-marker {
          transition: all 0.3s ease;
        }
      `}</style>
    </div>
  );
}
