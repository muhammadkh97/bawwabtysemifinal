/**
 * Geographic utilities for location-based features
 * Includes distance calculation and delivery fee estimation
 */

export interface Coordinates {
  latitude: number
  longitude: number
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param coord1 First coordinate (lat, lng)
 * @param coord2 Second coordinate (lat, lng)
 * @returns Distance in kilometers
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371 // Earth's radius in kilometers

  // Convert degrees to radians
  const lat1Rad = toRadians(coord1.latitude)
  const lat2Rad = toRadians(coord2.latitude)
  const dLat = toRadians(coord2.latitude - coord1.latitude)
  const dLon = toRadians(coord2.longitude - coord1.longitude)

  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in kilometers
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Calculate delivery fee based on distance
 * @param distanceKm Distance in kilometers
 * @param options Optional fee structure customization
 * @returns Delivery fee in SAR
 */
export function calculateDeliveryFee(
  distanceKm: number,
  options?: {
    baseFee?: number
    perKmFee?: number
    minFee?: number
    maxFee?: number
  }
): number {
  const {
    baseFee = 5.0, // Base fee in SAR
    perKmFee = 2.0, // Additional SAR per kilometer
    minFee = 5.0, // Minimum delivery fee
    maxFee = 50.0, // Maximum delivery fee
  } = options || {}

  // Calculate: base fee + (distance * per km fee)
  let calculatedFee = baseFee + distanceKm * perKmFee

  // Apply min and max limits
  if (calculatedFee < minFee) {
    calculatedFee = minFee
  } else if (calculatedFee > maxFee) {
    calculatedFee = maxFee
  }

  return Math.round(calculatedFee * 100) / 100 // Round to 2 decimal places
}

/**
 * Get delivery fee details with breakdown
 */
export function getDeliveryFeeDetails(distanceKm: number) {
  const baseFee = 5.0
  const perKmFee = 2.0
  const distanceFee = distanceKm * perKmFee
  const totalFee = calculateDeliveryFee(distanceKm)

  return {
    distance: Math.round(distanceKm * 100) / 100,
    baseFee,
    distanceFee: Math.round(distanceFee * 100) / 100,
    totalFee,
    breakdown: `${baseFee} ريال (رسوم أساسية) + ${Math.round(distanceFee * 100) / 100} ريال (${Math.round(distanceKm * 100) / 100} كم)`,
  }
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(6)}°, ${lng.toFixed(6)}°`
}

/**
 * Check if coordinates are valid
 */
export function isValidCoordinates(lat?: number, lng?: number): boolean {
  if (lat === undefined || lng === undefined) return false
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

/**
 * Saudi Arabia major cities with default coordinates
 */
export const saudiCities = {
  riyadh: { latitude: 24.7136, longitude: 46.6753, name: 'الرياض' },
  jeddah: { latitude: 21.4858, longitude: 39.1925, name: 'جدة' },
  mecca: { latitude: 21.3891, longitude: 39.8579, name: 'مكة المكرمة' },
  medina: { latitude: 24.5247, longitude: 39.5692, name: 'المدينة المنورة' },
  dammam: { latitude: 26.4207, longitude: 50.0888, name: 'الدمام' },
  taif: { latitude: 21.2703, longitude: 40.4158, name: 'الطائف' },
  tabuk: { latitude: 28.3835, longitude: 36.555, name: 'تبوك' },
  khamis: { latitude: 18.3067, longitude: 42.7279, name: 'خميس مشيط' },
  buraidah: { latitude: 26.326, longitude: 43.975, name: 'بريدة' },
  hail: { latitude: 27.5236, longitude: 41.6907, name: 'حائل' },
  hofuf: { latitude: 25.3691, longitude: 49.5868, name: 'الهفوف' },
  jubail: { latitude: 27.0174, longitude: 49.6625, name: 'الجبيل' },
  khobar: { latitude: 26.2172, longitude: 50.1971, name: 'الخبر' },
  yanbu: { latitude: 24.0896, longitude: 38.0618, name: 'ينبع' },
  abha: { latitude: 18.2164, longitude: 42.5053, name: 'أبها' },
}

/**
 * Find nearest city to given coordinates
 */
export function findNearestCity(lat: number, lng: number): {
  city: string
  distance: number
} {
  let nearestCity = ''
  let minDistance = Infinity

  Object.entries(saudiCities).forEach(([key, city]) => {
    const distance = calculateDistance({ latitude: lat, longitude: lng }, city)
    if (distance < minDistance) {
      minDistance = distance
      nearestCity = city.name
    }
  })

  return { city: nearestCity, distance: minDistance }
}
