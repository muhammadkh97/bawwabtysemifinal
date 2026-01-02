'use client'

import { useEffect, useRef } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icon in Next.js
if (typeof window !== 'undefined' && L.Icon && L.Icon.Default) {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })
}

interface DeliveryRouteMapProps {
  /** Pickup location (vendor/store) */
  pickupLat: number
  pickupLng: number
  pickupName?: string
  /** Delivery location (customer) */
  deliveryLat: number
  deliveryLng: number
  deliveryName?: string
  /** Driver current location (optional, real-time) */
  driverLat?: number
  driverLng?: number
  /** Height of the map */
  height?: string
  /** Show route line between points */
  showRoute?: boolean
}

export default function DeliveryRouteMap({
  pickupLat,
  pickupLng,
  pickupName = 'نقطة الاستلام',
  deliveryLat,
  deliveryLng,
  deliveryName = 'نقطة التوصيل',
  driverLat,
  driverLng,
  height = '500px',
  showRoute = true,
}: DeliveryRouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const pickupMarker = useRef<L.Marker | null>(null)
  const deliveryMarker = useRef<L.Marker | null>(null)
  const driverMarker = useRef<L.Marker | null>(null)
  const routeLine = useRef<L.Polyline | null>(null)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Create map
    map.current = L.map(mapContainer.current)

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map.current)

    // Custom icon for pickup (store)
    const pickupIcon = L.divIcon({
      html: '<div style="background: #10b981; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-size: 20px;">🏪</div>',
      className: 'custom-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    })

    // Custom icon for delivery (customer)
    const deliveryIcon = L.divIcon({
      html: '<div style="background: #ef4444; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-size: 20px;">📍</div>',
      className: 'custom-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    })

    // Custom icon for driver (moving)
    const driverIcon = L.divIcon({
      html: '<div style="background: #3b82f6; width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 12px rgba(0,0,0,0.4); font-size: 22px; animation: pulse 2s infinite;">🚗</div>',
      className: 'custom-marker',
      iconSize: [45, 45],
      iconAnchor: [22.5, 22.5],
    })

    // Add pickup marker
    pickupMarker.current = L.marker([pickupLat, pickupLng], { icon: pickupIcon })
      .addTo(map.current)
      .bindPopup(`<div class="text-center font-bold"><div class="text-green-600 text-lg">🏪 ${pickupName}</div><div class="text-xs text-gray-500 mt-1">${pickupLat.toFixed(6)}, ${pickupLng.toFixed(6)}</div></div>`)

    // Add delivery marker
    deliveryMarker.current = L.marker([deliveryLat, deliveryLng], { icon: deliveryIcon })
      .addTo(map.current)
      .bindPopup(`<div class="text-center font-bold"><div class="text-red-600 text-lg">📍 ${deliveryName}</div><div class="text-xs text-gray-500 mt-1">${deliveryLat.toFixed(6)}, ${deliveryLng.toFixed(6)}</div></div>`)

    // Add driver marker if location provided
    if (driverLat && driverLng) {
      driverMarker.current = L.marker([driverLat, driverLng], { icon: driverIcon })
        .addTo(map.current)
        .bindPopup(`<div class="text-center font-bold"><div class="text-blue-600 text-lg">🚗 السائق</div><div class="text-xs text-gray-500 mt-1">الموقع الحالي</div></div>`)
    }

    // Draw route line if enabled
    if (showRoute) {
      const points: L.LatLngExpression[] = [[pickupLat, pickupLng]]
      
      // If driver exists, draw line through driver position
      if (driverLat && driverLng) {
        points.push([driverLat, driverLng])
      }
      
      points.push([deliveryLat, deliveryLng])

      routeLine.current = L.polyline(points, {
        color: '#6366f1',
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 10',
      }).addTo(map.current)
    }

    // Fit bounds to show all markers
    const bounds = L.latLngBounds([
      [pickupLat, pickupLng],
      [deliveryLat, deliveryLng],
    ])
    if (driverLat && driverLng) {
      bounds.extend([driverLat, driverLng])
    }
    map.current.fitBounds(bounds, { padding: [50, 50] })

    // Add CSS for pulse animation
    const style = document.createElement('style')
    style.innerHTML = `
      @keyframes pulse {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.1);
        }
      }
    `
    document.head.appendChild(style)

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
      document.head.removeChild(style)
    }
  }, [pickupLat, pickupLng, deliveryLat, deliveryLng, driverLat, driverLng, showRoute])

  // Calculate distance for display
  const calculateDistance = () => {
    const R = 6371 // Earth's radius in km
    const dLat = ((deliveryLat - pickupLat) * Math.PI) / 180
    const dLon = ((deliveryLng - pickupLng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((pickupLat * Math.PI) / 180) *
        Math.cos((deliveryLat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return (R * c).toFixed(2)
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <div className="text-2xl mb-1">🏪</div>
          <div className="text-xs text-gray-600">نقطة الاستلام</div>
          <div className="text-sm font-bold text-green-700 mt-1">{pickupName}</div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-xl p-4">
          <div className="text-2xl mb-1">📍</div>
          <div className="text-xs text-gray-600">نقطة التوصيل</div>
          <div className="text-sm font-bold text-red-700 mt-1">{deliveryName}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
          <div className="text-2xl mb-1">📏</div>
          <div className="text-xs text-gray-600">المسافة</div>
          <div className="text-lg font-bold text-blue-700 mt-1">{calculateDistance()} كم</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-4">
          <div className="text-2xl mb-1">🚗</div>
          <div className="text-xs text-gray-600">حالة السائق</div>
          <div className="text-sm font-bold text-purple-700 mt-1">
            {driverLat && driverLng ? 'في الطريق' : 'لم يبدأ بعد'}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={mapContainer}
        style={{ height }}
        className="w-full rounded-xl border-2 border-gray-300 shadow-xl overflow-hidden"
      />

      {/* Legend */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <h4 className="font-bold text-gray-800 mb-3">دليل الخريطة</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏪</span>
            <span className="text-gray-700">نقطة الاستلام (المتجر)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📍</span>
            <span className="text-gray-700">نقطة التوصيل (العميل)</span>
          </div>
          {driverLat && driverLng && (
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚗</span>
              <span className="text-gray-700">موقع السائق الحالي</span>
            </div>
          )}
          {showRoute && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-indigo-500 opacity-80" style={{ borderTop: '2px dashed #6366f1' }}></div>
              <span className="text-gray-700">مسار التوصيل</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
