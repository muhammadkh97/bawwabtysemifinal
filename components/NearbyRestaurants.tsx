'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { MapPin, Star, ChefHat, Clock, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface Restaurant {
  id: string;
  shop_name: string;
  shop_name_ar: string;
  shop_logo: string;
  rating: number;
  reviews_count: number;
  latitude: number;
  longitude: number;
  min_order_amount: number;
  is_featured: boolean;
}

export default function NearbyRestaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationPermission('granted');
          fetchNearbyRestaurants(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.log('Location access denied:', error);
          setLocationPermission('denied');
          fetchFeaturedRestaurants();
        }
      );
    } else {
      fetchFeaturedRestaurants();
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const fetchNearbyRestaurants = async (lat: number, lng: number) => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, shop_name, shop_name_ar, shop_logo, rating, reviews_count, latitude, longitude, min_order_amount, is_featured')
        .eq('approval_status', 'approved')
        .eq('vendor_type', 'restaurant')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) throw error;

      const restaurantsWithDistance = (data || [])
        .map(restaurant => ({
          ...restaurant,
          distance: calculateDistance(lat, lng, restaurant.latitude, restaurant.longitude)
        }))
        .filter(r => r.distance <= 10)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 8);

      setRestaurants(restaurantsWithDistance);
    } catch (error) {
      console.error('Error fetching nearby restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, shop_name, shop_name_ar, shop_logo, rating, reviews_count, latitude, longitude, min_order_amount, is_featured')
        .eq('approval_status', 'approved')
        .eq('vendor_type', 'restaurant')
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false })
        .limit(8);

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-12 px-4 max-w-7xl mx-auto" dir="rtl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-4 animate-pulse">
              <div className="w-full h-48 bg-gray-200 rounded-2xl mb-4"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // لا نخفي السيكشن، بل نعرض رسالة إذا لم توجد مطاعم
  // if (restaurants.length === 0) {
  //   return null;
  // }

  return (
    <section className="py-12 px-4 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900">
              مطاعم قريبة منك
            </h2>
            <p className="text-gray-600 text-sm flex items-center gap-2 mt-1">
              <MapPin className="w-4 h-4" />
              {locationPermission === 'granted' ? 'حسب موقعك الحالي' : 'مطاعم متاحة للتوصيل'}
            </p>
          </div>
        </div>
        <Link
          href="/restaurants"
          className="px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 text-white rounded-xl sm:rounded-2xl hover:shadow-2xl transition-all font-bold transform hover:scale-105 text-xs sm:text-sm md:text-base whitespace-nowrap bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 w-full sm:w-auto text-center"
        >
          عرض جميع المطاعم
        </Link>
      </div>

      {/* Restaurants Grid */}
      {restaurants.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {restaurants.map((restaurant, index) => (
          <motion.div
            key={restaurant.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link href={`/vendor/${restaurant.id}`}>
              <div className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group cursor-pointer">
                {/* Restaurant Image */}
                <div className="relative h-48 overflow-hidden">
                  {restaurant.shop_logo ? (
                    <img
                      src={restaurant.shop_logo}
                      alt={restaurant.shop_name_ar}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                      <ChefHat className="w-20 h-20 text-white opacity-50" />
                    </div>
                  )}
                  
                  {restaurant.is_featured && (
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      مميز
                    </div>
                  )}
                </div>

                {/* Restaurant Info */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors line-clamp-1">
                    {restaurant.shop_name_ar || restaurant.shop_name}
                  </h3>
                  
                  <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-bold">{restaurant.rating?.toFixed(1) || '0.0'}</span>
                    </div>
                    
                    {(restaurant as any).distance && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span>{(restaurant as any).distance.toFixed(1)} كم</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span>20-30 د</span>
                    </div>
                  </div>

                  {restaurant.min_order_amount > 0 && (
                    <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-2 py-1">
                      الحد الأدنى: {restaurant.min_order_amount} ₪
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-12 h-12 text-orange-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد مطاعم متاحة حالياً</h3>
          <p className="text-gray-600 mb-6">
            {locationPermission === 'denied' 
              ? 'يمكنك تفعيل خدمات الموقع لرؤية المطاعم القريبة منك'
              : 'لا توجد مطاعم ضمن نطاق 10 كم من موقعك'
            }
          </p>
          <Link
            href="/restaurants"
            className="inline-block px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 text-white rounded-xl sm:rounded-2xl hover:shadow-2xl transition-all font-bold transform hover:scale-105 text-xs sm:text-sm md:text-base whitespace-nowrap bg-gradient-to-r from-orange-600 via-red-600 to-pink-600"
          >
            تصفح جميع المطاعم
          </Link>
        </div>
      )}
    </section>
  );
}
