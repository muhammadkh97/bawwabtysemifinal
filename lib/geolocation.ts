/**
 * مكتبة إدارة الموقع الجغرافي (Geolocation)
 * للتعامل مع المواقع، المسافات، والتتبع
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationData extends Coordinates {
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
}

export interface AddressComponents {
  city?: string;
  area?: string;
  street?: string;
  building?: string;
  floor?: string;
  apartment?: string;
  landmark?: string;
  postalCode?: string;
}

export interface FullAddress extends AddressComponents {
  coordinates: Coordinates;
  formattedAddress: string;
}

// ============================================
// الحصول على الموقع الحالي
// ============================================

export async function getCurrentLocation(options?: PositionOptions): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('المتصفح لا يدعم خاصية تحديد الموقع'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
          timestamp: new Date(position.timestamp),
        });
      },
      (error) => {
        reject(new Error(getGeolocationErrorMessage(error.code)));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
        ...options,
      }
    );
  });
}

// ============================================
// تتبع الموقع المستمر
// ============================================

export function watchLocation(
  callback: (location: LocationData) => void,
  errorCallback?: (error: Error) => void,
  options?: PositionOptions
): number {
  if (!navigator.geolocation) {
    if (errorCallback) {
      errorCallback(new Error('المتصفح لا يدعم خاصية تحديد الموقع'));
    }
    return -1;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude || undefined,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined,
        timestamp: new Date(position.timestamp),
      });
    },
    (error) => {
      if (errorCallback) {
        errorCallback(new Error(getGeolocationErrorMessage(error.code)));
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
      ...options,
    }
  );
}

export function stopWatchingLocation(watchId: number): void {
  if (navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
}

// ============================================
// حساب المسافة بين نقطتين (Haversine Formula)
// ============================================

export function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  const R = 6371; // نصف قطر الأرض بالكيلومتر
  
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) *
    Math.cos(toRadians(point2.lat)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // بالكيلومتر
  
  return Math.round(distance * 100) / 100; // تقريب لرقمين عشريين
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// ============================================
// حساب وقت الوصول المتوقع
// ============================================

export interface ETAResult {
  distanceKm: number;
  distanceText: string;
  durationMinutes: number;
  durationText: string;
  estimatedArrival: Date;
}

export function calculateETA(
  origin: Coordinates,
  destination: Coordinates,
  averageSpeedKmh: number = 40 // متوسط السرعة في المدن
): ETAResult {
  const distance = calculateDistance(origin, destination);
  const durationHours = distance / averageSpeedKmh;
  const durationMinutes = Math.ceil(durationHours * 60);
  
  const now = new Date();
  const estimatedArrival = new Date(now.getTime() + durationMinutes * 60000);
  
  return {
    distanceKm: distance,
    distanceText: distance < 1 
      ? `${Math.round(distance * 1000)} متر` 
      : `${distance.toFixed(1)} كم`,
    durationMinutes,
    durationText: durationMinutes < 60 
      ? `${durationMinutes} دقيقة` 
      : `${Math.floor(durationMinutes / 60)} ساعة و${durationMinutes % 60} دقيقة`,
    estimatedArrival,
  };
}

// ============================================
// التحقق من وجود نقطة داخل دائرة (منطقة توصيل)
// ============================================

export function isPointInRadius(
  point: Coordinates,
  center: Coordinates,
  radiusKm: number
): boolean {
  const distance = calculateDistance(point, center);
  return distance <= radiusKm;
}

// ============================================
// الحصول على العنوان من الإحداثيات (Reverse Geocoding)
// يتطلب Google Maps API
// ============================================

export async function getAddressFromCoordinates(
  coordinates: Coordinates,
  apiKey?: string
): Promise<string> {
  try {
    // إذا لم يكن هناك API key، نرجع الإحداثيات فقط
    if (!apiKey) {
      return `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`;
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinates.lat},${coordinates.lng}&key=${apiKey}&language=ar`
    );
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      return data.results[0].formatted_address;
    }
    
    return `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`;
  } catch (error) {
    console.error('خطأ في Reverse Geocoding:', error);
    return `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`;
  }
}

// ============================================
// الحصول على الإحداثيات من العنوان (Geocoding)
// يتطلب Google Maps API
// ============================================

export async function getCoordinatesFromAddress(
  address: string,
  apiKey?: string
): Promise<Coordinates | null> {
  try {
    if (!apiKey) {
      throw new Error('يتطلب Google Maps API Key');
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&language=ar`
    );
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
      };
    }
    
    return null;
  } catch (error) {
    console.error('خطأ في Geocoding:', error);
    return null;
  }
}

// ============================================
// فتح الموقع في تطبيقات الخرائط
// ============================================

export function openInGoogleMaps(coordinates: Coordinates): void {
  const url = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
  window.open(url, '_blank');
}

export function openInAppleMaps(coordinates: Coordinates): void {
  const url = `http://maps.apple.com/?ll=${coordinates.lat},${coordinates.lng}`;
  window.open(url, '_blank');
}

export function openDirections(origin: Coordinates, destination: Coordinates): void {
  const url = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;
  window.open(url, '_blank');
}

// ============================================
// حفظ الموقع في قاعدة البيانات
// ============================================

export async function saveLocationToDatabase(
  driverId: string,
  location: LocationData,
  orderId?: string
): Promise<boolean> {
  try {
    // سيتم ربطه بـ Supabase
    const response = await fetch('/api/driver-location', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        driver_id: driverId,
        order_id: orderId,
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy,
        speed: location.speed,
        heading: location.heading,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('خطأ في حفظ الموقع:', error);
    return false;
  }
}

// ============================================
// الحصول على آخر موقع للسائق
// ============================================

export async function getDriverLastLocation(driverId: string): Promise<LocationData | null> {
  try {
    const response = await fetch(`/api/driver-location/${driverId}`);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return {
      ...data,
      timestamp: new Date(data.timestamp),
    };
  } catch (error) {
    console.error('خطأ في جلب موقع السائق:', error);
    return null;
  }
}

// ============================================
// رسائل الأخطاء
// ============================================

function getGeolocationErrorMessage(errorCode: number): string {
  switch (errorCode) {
    case 1: // PERMISSION_DENIED
      return 'تم رفض الوصول للموقع. يرجى السماح بالوصول في إعدادات المتصفح.';
    case 2: // POSITION_UNAVAILABLE
      return 'الموقع غير متاح حالياً. تأكد من تفعيل GPS.';
    case 3: // TIMEOUT
      return 'انتهت مهلة طلب الموقع. حاول مرة أخرى.';
    default:
      return 'خطأ غير معروف في تحديد الموقع.';
  }
}

// ============================================
// التحقق من دعم المتصفح للموقع
// ============================================

export function isGeolocationSupported(): boolean {
  return 'geolocation' in navigator;
}

// ============================================
// طلب صلاحيات الموقع
// ============================================

export async function requestLocationPermission(): Promise<boolean> {
  try {
    if (!isGeolocationSupported()) {
      return false;
    }

    const result = await navigator.permissions.query({ name: 'geolocation' });
    
    if (result.state === 'granted') {
      return true;
    }
    
    if (result.state === 'prompt') {
      // محاولة الحصول على الموقع لطلب الصلاحية
      await getCurrentLocation();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('خطأ في طلب صلاحيات الموقع:', error);
    return false;
  }
}

// ============================================
// حساب منطقة التغطية (Coverage Area)
// ============================================

export interface CoverageArea {
  center: Coordinates;
  radiusKm: number;
  boundary: Coordinates[]; // نقاط الحدود (مضلع)
}

export function createCoverageCircle(
  center: Coordinates,
  radiusKm: number,
  points: number = 32
): Coordinates[] {
  const circle: Coordinates[] = [];
  const earthRadius = 6371; // km
  
  for (let i = 0; i < points; i++) {
    const angle = (i * 360) / points;
    const angleRad = toRadians(angle);
    
    const latOffset = (radiusKm / earthRadius) * (180 / Math.PI);
    const lngOffset = (radiusKm / earthRadius) * (180 / Math.PI) / Math.cos(toRadians(center.lat));
    
    const lat = center.lat + latOffset * Math.sin(angleRad);
    const lng = center.lng + lngOffset * Math.cos(angleRad);
    
    circle.push({ lat, lng });
  }
  
  return circle;
}

// ============================================
// تنسيق الإحداثيات للعرض
// ============================================

export function formatCoordinates(coordinates: Coordinates, precision: number = 4): string {
  return `${coordinates.lat.toFixed(precision)}°, ${coordinates.lng.toFixed(precision)}°`;
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} متر`;
  }
  return `${distanceKm.toFixed(1)} كم`;
}

// ============================================
// التصدير
// ============================================

export default {
  getCurrentLocation,
  watchLocation,
  stopWatchingLocation,
  calculateDistance,
  calculateETA,
  isPointInRadius,
  getAddressFromCoordinates,
  getCoordinatesFromAddress,
  openInGoogleMaps,
  openInAppleMaps,
  openDirections,
  saveLocationToDatabase,
  getDriverLastLocation,
  isGeolocationSupported,
  requestLocationPermission,
  createCoverageCircle,
  formatCoordinates,
  formatDistance,
};
