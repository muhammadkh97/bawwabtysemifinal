'use client';

import { useEffect, useRef } from 'react';

// Dynamically import Leaflet only on client side
let L: typeof import('leaflet') | undefined;
if (typeof window !== 'undefined') {
  L = require('leaflet');
  require('leaflet/dist/leaflet.css');
  
  // Fix for default marker icon in Next.js
  if (L && L.Icon && L.Icon.Default) {
    const proto = L.Icon.Default.prototype as { _getIconUrl?: unknown };
    delete proto._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }
}

interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: Date;
}

interface LocationMapComponentProps {
  currentLocation: LocationData;
  locationHistory: LocationData[];
  isTracking: boolean;
}

export default function LocationMapComponent({
  currentLocation,
  locationHistory,
  isTracking,
}: LocationMapComponentProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const currentMarker = useRef<any>(null);
  const accuracyCircle = useRef<any>(null);
  const pathLine = useRef<any>(null);
  const historyMarkers = useRef<any[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainer.current || map.current || !L) return;

    // Create map
    map.current = L.map(mapContainer.current).setView(
      [currentLocation.lat, currentLocation.lng],
      15
    );

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map.current);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update map markers and path
  useEffect(() => {
    if (!map.current) return;

    // Remove old markers and path
    if (currentMarker.current) currentMarker.current.remove();
    if (accuracyCircle.current) accuracyCircle.current.remove();
    if (pathLine.current) pathLine.current.remove();
    historyMarkers.current.forEach((m) => m.remove());
    historyMarkers.current = [];

    // Add accuracy circle
    accuracyCircle.current = L.circle(
      [currentLocation.lat, currentLocation.lng],
      {
        color: '#3b82f6',
        fillColor: '#93c5fd',
        fillOpacity: 0.2,
        radius: currentLocation.accuracy,
        weight: 2,
      }
    ).addTo(map.current);

    // Add current location marker
    const driverIcon = L.divIcon({
      html: `<div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-size: 22px; animation: pulse 2s infinite;">🚗</div>`,
      className: 'custom-marker',
      iconSize: [50, 50],
      iconAnchor: [25, 25],
    });

    currentMarker.current = L.marker([currentLocation.lat, currentLocation.lng], {
      icon: driverIcon,
      zIndexOffset: 1000,
    })
      .addTo(map.current)
      .bindPopup(
        `<div class="text-center font-bold">
          <div class="text-blue-600 text-lg">🚗 موقعك الحالي</div>
          <div class="text-xs text-gray-600 mt-2">
            <div>${currentLocation.lat.toFixed(6)}°</div>
            <div>${currentLocation.lng.toFixed(6)}°</div>
            <div class="text-gray-500 mt-1">دقة: ±${currentLocation.accuracy.toFixed(1)}م</div>
            ${currentLocation.speed !== null ? `<div class="text-gray-500">سرعة: ${currentLocation.speed.toFixed(1)} كم/س</div>` : ''}
          </div>
        </div>`
      )
      .openPopup();

    // Add path line from history
    if (locationHistory.length > 1) {
      const pathPoints = locationHistory.map((loc) => [loc.lat, loc.lng] as [number, number]);

      // Gradient line with multiple colored segments
      pathLine.current = L.polyline(pathPoints, {
        color: '#8b5cf6',
        weight: 3,
        opacity: 0.7,
        dashArray: '5, 5',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map.current);

      // Add history markers at intervals (every 5th location)
      locationHistory.forEach((loc, idx) => {
        if (idx % 5 === 0 && idx !== locationHistory.length - 1) {
          const historyIcon = L.divIcon({
            html: `<div style="background: rgba(139, 92, 246, 0.8); width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.2);"></div>`,
            className: 'custom-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });

          const marker = L.marker([loc.lat, loc.lng], { icon: historyIcon })
            .addTo(map.current!)
            .bindPopup(
              `<div class="text-xs font-semibold text-gray-700">
                ${loc.timestamp.toLocaleTimeString('ar-SA')}
              </div>`
            );

          historyMarkers.current.push(marker);
        }
      });
    }

    // Center map on current location
    map.current.setView([currentLocation.lat, currentLocation.lng], 15);
  }, [currentLocation, locationHistory]);

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
