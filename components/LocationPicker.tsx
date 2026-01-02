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

interface LocationPickerProps {
  /** Initial latitude (default: Riyadh 24.7136) */
  initialLat?: number
  /** Initial longitude (default: Riyadh 46.6753) */
  initialLng?: number
  /** Callback when location is selected */
  onLocationSelect: (lat: number, lng: number, address?: string) => void
  /** Height of the map container */
  height?: string
  /** Whether to show current location button */
  showCurrentLocation?: boolean
  /** Placeholder text for search */
  searchPlaceholder?: string
}

export default function LocationPicker({
  initialLat = 24.7136,
  initialLng = 46.6753,
  onLocationSelect,
  height = '400px',
  showCurrentLocation = true,
  searchPlaceholder = 'ابحث عن موقعك...',
}: LocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const marker = useRef<L.Marker | null>(null)
  
  const [selectedLocation, setSelectedLocation] = useState({
    lat: initialLat,
    lng: initialLng,
  })
  const [address, setAddress] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Create map
    map.current = L.map(mapContainer.current).setView([initialLat, initialLng], 13)

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map.current)

    // Add click listener to place marker
    map.current.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng
      updateMarker(lat, lng)
      getAddressFromCoordinates(lat, lng)
    })

    // Add initial marker
    marker.current = L.marker([initialLat, initialLng], {
      draggable: true,
    }).addTo(map.current)

    // Handle marker drag
    marker.current.on('dragend', (e: L.DragEndEvent) => {
      const { lat, lng } = e.target.getLatLng()
      updateMarker(lat, lng)
      getAddressFromCoordinates(lat, lng)
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Update marker position
  const updateMarker = (lat: number, lng: number) => {
    if (marker.current) {
      marker.current.setLatLng([lat, lng])
    }
    if (map.current) {
      map.current.setView([lat, lng], map.current.getZoom())
    }
    setSelectedLocation({ lat, lng })
    onLocationSelect(lat, lng)
  }

  // Get address from coordinates using reverse geocoding
  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`
      )
      const data = await response.json()
      const formattedAddress = data.display_name || 'عنوان غير معروف'
      setAddress(formattedAddress)
      onLocationSelect(lat, lng, formattedAddress)
    } catch (error) {
      console.error('Error fetching address:', error)
      setAddress('تعذر الحصول على العنوان')
    } finally {
      setLoading(false)
    }
  }

  // Get current location using browser GPS
  const getCurrentLocation = () => {
    setLoading(true)
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          updateMarker(latitude, longitude)
          getAddressFromCoordinates(latitude, longitude)
          setLoading(false)
        },
        (error) => {
          console.error('Error getting location:', error)
          alert('تعذر الحصول على موقعك الحالي. يرجى التأكد من تفعيل خدمات الموقع.')
          setLoading(false)
        }
      )
    } else {
      alert('المتصفح لا يدعم خدمات الموقع')
      setLoading(false)
    }
  }

  // Search for location by name/address
  const searchLocation = async () => {
    if (!searchQuery.trim()) return
    
    setLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&accept-language=ar&limit=1`
      )
      const data = await response.json()
      
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0]
        updateMarker(parseFloat(lat), parseFloat(lon))
        setAddress(display_name)
        onLocationSelect(parseFloat(lat), parseFloat(lon), display_name)
      } else {
        alert('لم يتم العثور على الموقع. حاول استخدام اسم أكثر تحديداً.')
      }
    } catch (error) {
      console.error('Error searching location:', error)
      alert('حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
            placeholder={searchPlaceholder}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {loading && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        <button
          onClick={searchLocation}
          disabled={loading || !searchQuery.trim()}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          بحث
        </button>
        {showCurrentLocation && (
          <button
            onClick={getCurrentLocation}
            disabled={loading}
            className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            title="موقعي الحالي"
          >
            📍
          </button>
        )}
      </div>

      {/* Map Container */}
      <div
        ref={mapContainer}
        style={{ height }}
        className="w-full rounded-lg border-2 border-gray-300 shadow-lg overflow-hidden"
      />

      {/* Selected Location Info */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
        <div className="flex items-start gap-3">
          <div className="text-2xl">📍</div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1">الموقع المحدد</h3>
            {address ? (
              <p className="text-sm text-gray-700 mb-2">{address}</p>
            ) : (
              <p className="text-sm text-gray-500 mb-2">انقر على الخريطة لتحديد الموقع</p>
            )}
            <div className="flex gap-4 text-xs text-gray-600">
              <span>
                <strong>خط العرض:</strong> {selectedLocation.lat.toFixed(6)}
              </span>
              <span>
                <strong>خط الطول:</strong> {selectedLocation.lng.toFixed(6)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
          💡 كيفية الاستخدام
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• انقر على الخريطة لتحديد الموقع</li>
          <li>• اسحب الدبوس 📍 لتحريكه</li>
          <li>• استخدم شريط البحث للعثور على عنوان محدد</li>
          <li>• اضغط على 📍 للانتقال إلى موقعك الحالي</li>
        </ul>
      </div>
    </div>
  )
}
