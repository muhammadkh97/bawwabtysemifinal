'use client'

import { useEffect, useRef, useState } from 'react'
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

interface OrderLocation {
  lat: number
  lng: number
  orderId: string
  orderTotal: number
  customerName?: string
}

interface VendorAnalyticsMapProps {
  /** Center of the map (vendor location) */
  centerLat?: number
  centerLng?: number
  /** List of order locations */
  orders: OrderLocation[]
  /** Height of the map */
  height?: string
  /** Show heat map circles */
  showHeatmap?: boolean
}

export default function VendorAnalyticsMap({
  centerLat = 24.7136,
  centerLng = 46.6753,
  orders,
  height = '600px',
  showHeatmap = true,
}: VendorAnalyticsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const [selectedArea, setSelectedArea] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    topArea: '',
    avgDistance: 0,
  })

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Create map
    map.current = L.map(mapContainer.current).setView([centerLat, centerLng], 12)

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map.current)

    // Add vendor location marker (center)
    const vendorIcon = L.divIcon({
      html: '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-size: 24px;">🏪</div>',
      className: 'custom-marker',
      iconSize: [50, 50],
      iconAnchor: [25, 25],
    })

    L.marker([centerLat, centerLng], { icon: vendorIcon })
      .addTo(map.current)
      .bindPopup('<div class="text-center font-bold"><div class="text-purple-600 text-lg">🏪 موقع متجرك</div></div>')

    // Group orders by location (cluster nearby orders)
    const orderClusters = clusterOrders(orders, 0.01) // ~1km radius

    // Add markers for each cluster
    orderClusters.forEach((cluster) => {
      const orderCount = cluster.orders.length
      const totalRevenue = cluster.orders.reduce((sum, o) => sum + o.orderTotal, 0)

      // Circle size based on order count (bigger = more orders)
      const radius = Math.sqrt(orderCount) * 50 + 100

      // Color intensity based on revenue
      const intensity = Math.min(totalRevenue / 1000, 1) // Max at 1000 SAR
      const color = `rgba(239, 68, 68, ${0.3 + intensity * 0.5})` // Red with varying opacity

      // Add circle for heatmap effect
      if (showHeatmap) {
        L.circle([cluster.lat, cluster.lng], {
          color: '#ef4444',
          fillColor: color,
          fillOpacity: 0.4,
          radius: radius,
          weight: 2,
        })
          .addTo(map.current!)
          .bindPopup(`
            <div class="text-center p-2">
              <div class="font-bold text-lg text-gray-800 mb-2">📍 منطقة طلبات</div>
              <div class="text-sm space-y-1">
                <div><strong>عدد الطلبات:</strong> ${orderCount}</div>
                <div><strong>إجمالي المبيعات:</strong> ${totalRevenue.toFixed(2)} ر.س</div>
                <div class="text-xs text-gray-500 mt-1">${cluster.lat.toFixed(4)}, ${cluster.lng.toFixed(4)}</div>
              </div>
            </div>
          `)
      }

      // Add marker with count badge
      const clusterIcon = L.divIcon({
        html: `<div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 3px 10px rgba(0,0,0,0.3); font-weight: bold; color: white; font-size: 16px;">${orderCount}</div>`,
        className: 'custom-marker',
        iconSize: [45, 45],
        iconAnchor: [22.5, 22.5],
      })

      L.marker([cluster.lat, cluster.lng], { icon: clusterIcon })
        .addTo(map.current!)
        .bindPopup(`
          <div class="text-center p-2">
            <div class="font-bold text-red-600 text-lg mb-2">📦 ${orderCount} طلب</div>
            <div class="text-sm">
              <div><strong>المبيعات:</strong> ${totalRevenue.toFixed(2)} ر.س</div>
              <div class="text-xs text-gray-500 mt-2">انقر لعرض التفاصيل</div>
            </div>
          </div>
        `)
        .on('click', () => {
          setSelectedArea(`${cluster.lat.toFixed(4)}, ${cluster.lng.toFixed(4)}`)
        })
    })

    // Calculate statistics
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, o) => sum + o.orderTotal, 0)
    const areaGroups = groupByArea(orders)
    const topArea = Object.entries(areaGroups).sort((a, b) => b[1].count - a[1].count)[0]?.[0] || 'غير محدد'
    const avgDistance = calculateAverageDistance(orders, centerLat, centerLng)

    setStats({
      totalOrders,
      totalRevenue,
      topArea,
      avgDistance,
    })

    // Fit bounds to show all orders
    if (orders.length > 0) {
      const bounds = L.latLngBounds(orders.map((o) => [o.lat, o.lng]))
      bounds.extend([centerLat, centerLng])
      map.current.fitBounds(bounds, { padding: [50, 50] })
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [orders, centerLat, centerLng, showHeatmap])

  // Cluster nearby orders
  const clusterOrders = (orders: OrderLocation[], threshold: number) => {
    const clusters: { lat: number; lng: number; orders: OrderLocation[] }[] = []
    const used = new Set<number>()

    orders.forEach((order, i) => {
      if (used.has(i)) return

      const cluster = {
        lat: order.lat,
        lng: order.lng,
        orders: [order],
      }

      orders.forEach((otherOrder, j) => {
        if (i === j || used.has(j)) return

        const distance = Math.sqrt(
          Math.pow(order.lat - otherOrder.lat, 2) + Math.pow(order.lng - otherOrder.lng, 2)
        )

        if (distance < threshold) {
          cluster.orders.push(otherOrder)
          used.add(j)
        }
      })

      used.add(i)
      clusters.push(cluster)
    })

    return clusters
  }

  // Group orders by approximate area
  const groupByArea = (orders: OrderLocation[]) => {
    const areas: Record<string, { count: number; revenue: number }> = {}

    orders.forEach((order) => {
      const areaKey = `${Math.floor(order.lat * 100) / 100},${Math.floor(order.lng * 100) / 100}`
      if (!areas[areaKey]) {
        areas[areaKey] = { count: 0, revenue: 0 }
      }
      areas[areaKey].count++
      areas[areaKey].revenue += order.orderTotal
    })

    return areas
  }

  // Calculate average distance from vendor
  const calculateAverageDistance = (orders: OrderLocation[], vendorLat: number, vendorLng: number) => {
    if (orders.length === 0) return 0

    const totalDistance = orders.reduce((sum, order) => {
      const R = 6371 // Earth's radius in km
      const dLat = ((order.lat - vendorLat) * Math.PI) / 180
      const dLon = ((order.lng - vendorLng) * Math.PI) / 180
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((vendorLat * Math.PI) / 180) *
          Math.cos((order.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return sum + R * c
    }, 0)

    return totalDistance / orders.length
  }

  return (
    <div className="space-y-6">
      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="text-3xl mb-2">📦</div>
          <div className="text-sm text-gray-600 mb-1">إجمالي الطلبات</div>
          <div className="text-3xl font-bold text-blue-600">{stats.totalOrders}</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
          <div className="text-3xl mb-2">💰</div>
          <div className="text-sm text-gray-600 mb-1">إجمالي المبيعات</div>
          <div className="text-2xl font-bold text-green-600">{stats.totalRevenue.toFixed(0)} ر.س</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-200 rounded-xl p-6">
          <div className="text-3xl mb-2">🎯</div>
          <div className="text-sm text-gray-600 mb-1">أكثر منطقة طلباً</div>
          <div className="text-sm font-bold text-purple-600">{stats.topArea}</div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-6">
          <div className="text-3xl mb-2">📏</div>
          <div className="text-sm text-gray-600 mb-1">متوسط المسافة</div>
          <div className="text-2xl font-bold text-orange-600">{stats.avgDistance.toFixed(1)} كم</div>
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={mapContainer}
        style={{ height }}
        className="w-full rounded-xl border-2 border-gray-300 shadow-2xl overflow-hidden"
      />

      {/* Legend and Insights */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6">
        <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
          <span className="text-2xl">💡</span>
          رؤى تحليلية
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">دليل الخريطة:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-xl">🏪</span>
                <span>موقع متجرك (مركز التوزيع)</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">
                  N
                </div>
                <span>عدد الطلبات في المنطقة</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-red-200"></div>
                <span>الدوائر تمثل تركز الطلبات (أكبر = أكثر طلبات)</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">توصيات:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>ركز على المناطق ذات التركيز العالي للطلبات لتحسين وقت التوصيل</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>فكر في فتح نقطة توزيع فرعية في المناطق البعيدة</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>عروض خاصة للمناطق ذات الطلبات القليلة لزيادة المبيعات</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
