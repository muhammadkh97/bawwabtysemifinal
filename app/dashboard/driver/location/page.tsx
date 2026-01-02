'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { toast } from 'react-hot-toast';
import {
  MapPin,
  Navigation,
  AlertCircle,
  CheckCircle,
  XCircle,
  Watch,
  Zap,
  Compass,
  Share2,
  Copy,
  Smartphone,
  Clock,
  Map,
  Power,
} from 'lucide-react';
import LocationMapComponent from '@/components/LocationMapComponent';

interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: Date;
  address?: string;
}

declare global {
  interface Navigator {
    geolocation: Geolocation;
    clipboard: Clipboard;
    share?: (data: ShareData) => Promise<void>;
    permissions: Permissions;
  }
  interface Window {
    open: (url: string, target: string) => void;
  }
}

interface DriverStats {
  driverId: string;
  isOnline: boolean;
  totalDistance: number;
  todayDistance: number;
  activeSince: Date | null;
}

export default function DriverLocationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);
  const [stats, setStats] = useState<DriverStats>({
    driverId: '',
    isOnline: false,
    totalDistance: 0,
    todayDistance: 0,
    activeSince: null,
  });
  const [permissionStatus, setPermissionStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
  const watchId = useRef<number | null>(null);
  const lastLocationRef = useRef<LocationData | null>(null);
  const distanceRef = useRef<number>(0);
  const [shareUrl, setShareUrl] = useState<string>('');

  useEffect(() => {
    initializeDriver();
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  const initializeDriver = async () => {
    try {
      // Get current user using our auth helper
      const result = await getCurrentUser();
      const authUser = result.user;
      
      if (!authUser) {
        router.push('/login');
        return;
      }

      const { data: driverData } = await supabase
        .from('drivers')
        .select('id, is_available, current_location, updated_at')
        .eq('user_id', authUser.id)
        .single();

      if (!driverData) {
        toast.error('لم يتم العثور على بيانات السائق');
        return;
      }

      setStats((prev) => ({
        ...prev,
        driverId: driverData.id,
        isOnline: driverData.is_available || false,
        activeSince: driverData.updated_at ? new Date(driverData.updated_at) : null,
      }));

      // Check location permission status
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setPermissionStatus(permission.state as any);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('حدث خطأ في تحميل البيانات');
      setLoading(false);
    }
  };

  const startTracking = async () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      toast.error('المتصفح لا يدعم خدمة الموقع');
      return;
    }

    try {
      // Request permission first
      watchId.current = navigator.geolocation.watchPosition(
        async (position) => {
          const newLocation: LocationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
            timestamp: new Date(),
          };

          // Calculate distance if we have a previous location
          if (lastLocationRef.current) {
            const distance = calculateDistance(lastLocationRef.current, newLocation);
            if (distance > 0.01) { // Only count if moved more than 10 meters
              distanceRef.current += distance;
              setStats((prev) => ({
                ...prev,
                todayDistance: prev.todayDistance + distance,
              }));
            }
          }

          setLocation(newLocation);
          lastLocationRef.current = newLocation;

          // Keep location history (last 100 locations)
          setLocationHistory((prev) => [...prev.slice(-99), newLocation]);

          // Save to database periodically (every 5 seconds)
          if (Date.now() % 5000 < 1000) {
            await saveLocationToDatabase(newLocation);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          if (error.code === error.PERMISSION_DENIED) {
            setPermissionStatus('denied');
            toast.error('تم رفض صلاحيات الموقع. يرجى تفعيلها من إعدادات المتصفح');
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            toast.error('خدمة الموقع غير متاحة');
          } else if (error.code === error.TIMEOUT) {
            toast.error('انتهت مهلة زمنية عند محاولة الحصول على الموقع');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );

      setIsTracking(true);
      toast.success('✅ تم بدء تتبع الموقع');
      setPermissionStatus('granted');

      // Update online status
      await updateDriverStatus(true);
    } catch (error) {
      console.error('Error starting tracking:', error);
      toast.error('حدث خطأ في بدء التتبع');
    }
  };

  const stopTracking = async () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    setIsTracking(false);
    toast.success('✅ تم إيقاف تتبع الموقع');

    // Update online status
    await updateDriverStatus(false);
  };

  const saveLocationToDatabase = async (loc: LocationData) => {
    try {
      // Get active order if exists
      const result = await getCurrentUser();
      const authUser = result.user;
      if (!authUser) return;

      const { data: driverData } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', authUser.id)
        .single();

      if (!driverData) return;

      const { data: activeOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('driver_id', driverData.id)
        .eq('status', 'out_for_delivery')
        .single();

      // Save location
      const { error } = await supabase
        .from('driver_locations')
        .insert([
          {
            driver_id: driverData.id,
            order_id: activeOrder?.id,
            lat: loc.lat,
            lng: loc.lng,
            accuracy: loc.accuracy,
            speed: loc.speed,
            heading: loc.heading,
            battery_level: (navigator as any).getBattery?.() ? Math.round((navigator as any).getBattery().level * 100) : null,
            created_at: new Date().toISOString(),
          },
        ]);

      if (!error) {
        // Also update driver's current location
        await supabase
          .from('drivers')
          .update({
            current_location: { lat: loc.lat, lng: loc.lng },
            is_available: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', driverData.id);
      }
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  const updateDriverStatus = async (isOnline: boolean) => {
    try {
      // Get current user using our auth helper
      const result = await getCurrentUser();
      const authUser = result.user;
      if (!authUser) return;

      const { data: driverData } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', authUser.id)
        .single();

      if (driverData) {
        await supabase
          .from('drivers')
          .update({
            is_available: isOnline,
            updated_at: new Date().toISOString(),
          })
          .eq('id', driverData.id);

        setStats((prev) => ({
          ...prev,
          isOnline,
          activeSince: isOnline ? new Date() : prev.activeSince,
        }));
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const calculateDistance = (loc1: LocationData, loc2: LocationData): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.lat - loc1.lat) * (Math.PI / 180);
    const dLng = (loc2.lng - loc1.lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(loc1.lat * (Math.PI / 180)) *
        Math.cos(loc2.lat * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const copyCoordinates = () => {
    if (location) {
      const text = `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
      navigator.clipboard.writeText(text);
      toast.success('✅ تم نسخ الإحداثيات');
    }
  };

  const shareLocation = () => {
    if (location) {
      const mapsUrl = `https://maps.google.com/?q=${location.lat},${location.lng}`;
      if (navigator.share) {
        navigator.share({
          title: 'موقعي الحالي',
          text: 'موقع السائق الحالي',
          url: mapsUrl,
        });
      } else {
        navigator.clipboard.writeText(mapsUrl);
        toast.success('✅ تم نسخ رابط الموقع');
      }
    }
  };

  const openInGoogleMaps = () => {
    if (typeof window !== 'undefined' && location) {
      const mapsUrl = `https://maps.google.com/?q=${location.lat},${location.lng}`;
      window.open(mapsUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Navigation className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  موقعي الحالي
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  تتبع ومراقبة موقعك في الوقت الفعلي
                </p>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${
              stats.isOnline
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
            }`}>
              <div className={`w-3 h-3 rounded-full ${stats.isOnline ? 'bg-green-500' : 'bg-gray-500'} animate-pulse`} />
              {stats.isOnline ? 'متصل' : 'غير متصل'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Warning Message */}
        {permissionStatus === 'denied' && (
          <div className="mb-6 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-100">صلاحيات الموقع مرفوضة</h3>
              <p className="text-red-700 dark:text-red-200 text-sm mt-1">
                يرجى تفعيل صلاحيات الموقع من إعدادات المتصفح للسماح بتتبع موقعك
              </p>
            </div>
          </div>
        )}

        {/* Main Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Tracking Control Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 lg:col-span-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              التحكم في التتبع
            </h2>

            <div className="space-y-4">
              {!isTracking ? (
                <button
                  onClick={startTracking}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <Power className="w-5 h-5" />
                  بدء التتبع
                </button>
              ) : (
                <button
                  onClick={stopTracking}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <Power className="w-5 h-5" />
                  إيقاف التتبع
                </button>
              )}

              {location && (
                <>
                  <button
                    onClick={copyCoordinates}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    نسخ الإحداثيات
                  </button>

                  <button
                    onClick={shareLocation}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    مشاركة الموقع
                  </button>

                  <button
                    onClick={openInGoogleMaps}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Map className="w-4 h-4" />
                    فتح في خرائط جوجل
                  </button>
                </>
              )}
            </div>

            {/* Status Card */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">حالة التتبع</span>
                <div className="flex items-center gap-2">
                  {isTracking ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-semibold text-green-600 dark:text-green-400">قيد التتبع</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-gray-500" />
                      <span className="font-semibold text-gray-600 dark:text-gray-400">متوقف</span>
                    </>
                  )}
                </div>
              </div>

              {location && (
                <>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm text-gray-600 dark:text-gray-400">دقة الموقع</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      ±{location.accuracy.toFixed(1)}م
                    </span>
                  </div>

                  {location.speed !== null && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">السرعة</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {location.speed.toFixed(1)} كم/س
                      </span>
                    </div>
                  )}

                  {location.heading !== null && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm text-gray-600 dark:text-gray-400">الاتجاه</span>
                      <div className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {location.heading.toFixed(0)}°
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Location Info & Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Location */}
            {location && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  الموقع الحالي
                </h2>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                      <p className="text-xs text-blue-600 dark:text-blue-300 font-semibold uppercase">
                        خط العرض
                      </p>
                      <p className="text-lg font-bold text-blue-900 dark:text-blue-100 mt-1">
                        {location.lat.toFixed(6)}°
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900 rounded-lg">
                      <p className="text-xs text-purple-600 dark:text-purple-300 font-semibold uppercase">
                        خط الطول
                      </p>
                      <p className="text-lg font-bold text-purple-900 dark:text-purple-100 mt-1">
                        {location.lng.toFixed(6)}°
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase">
                      آخر تحديث
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                      {location.timestamp.toLocaleTimeString('ar-SA')}
                      <span className="text-gray-500 dark:text-gray-400 text-xs mr-2">
                        ({location.timestamp.toLocaleDateString('ar-SA')})
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">مسافة اليوم</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.todayDistance.toFixed(1)} كم
                    </p>
                  </div>
                  <Zap className="w-8 h-8 text-orange-500 opacity-50" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">الوقت النشط</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.activeSince
                        ? Math.floor(
                            (new Date().getTime() - stats.activeSince.getTime()) / 60000
                          )
                        : 0}{' '}
                      دقيقة
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-500 opacity-50" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        {location && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6">
            <div className="h-[500px] rounded-lg overflow-hidden">
              <LocationMapComponent
                currentLocation={location}
                locationHistory={locationHistory}
                isTracking={isTracking}
              />
            </div>
          </div>
        )}

        {/* Location History */}
        {locationHistory.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Watch className="w-5 h-5 text-purple-600" />
              سجل المواقع ({locationHistory.length})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 font-semibold">
                      الوقت
                    </th>
                    <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 font-semibold">
                      خط العرض
                    </th>
                    <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 font-semibold">
                      خط الطول
                    </th>
                    <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 font-semibold">
                      الدقة
                    </th>
                    <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 font-semibold">
                      السرعة
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {locationHistory.slice(-10).reverse().map((loc, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                        {loc.timestamp.toLocaleTimeString('ar-SA')}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-mono text-xs">
                        {loc.lat.toFixed(6)}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-mono text-xs">
                        {loc.lng.toFixed(6)}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                        ±{loc.accuracy.toFixed(1)}م
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                        {loc.speed !== null ? `${loc.speed.toFixed(1)} كم/س` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!location && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
            <Smartphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              لم يتم الحصول على الموقع بعد
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              اضغط على زر "بدء التتبع" لبدء مراقبة موقعك في الوقت الفعلي
            </p>
            {permissionStatus !== 'granted' && (
              <p className="text-amber-600 dark:text-amber-400 text-sm">
                تأكد من السماح بالوصول لخدمة الموقع
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
