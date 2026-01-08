'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { MapPin, Star, Clock, ChefHat, Search, Filter, DollarSign } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    fetchRestaurants();
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
        },
        (error) => {
        }
      );
    }
  };

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id, shop_name, shop_name_ar, shop_logo, rating, reviews_count, latitude, longitude, min_order_amount, is_featured')
        .eq('approval_status', 'approved')
        .eq('vendor_type', 'restaurant')
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false });

      if (error) throw error;
      
      // فلترة المطاعم فقط (يمكن إضافة حقل restaurant_type لاحقاً)
      const restaurantData = data || [];
      setRestaurants(restaurantData);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
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

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.shop_name_ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.shop_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6">
              <ChefHat className="w-12 h-12" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-4">
              استكشف أفضل المطاعم 🍽️
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8">
              اطلب وجباتك المفضلة من آلاف المطاعم المميزة
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input
                  type="text"
                  placeholder="ابحث عن مطعم..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-14 pl-6 py-5 rounded-2xl text-gray-900 text-lg focus:outline-none focus:ring-4 focus:ring-white/50"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Restaurants Grid */}
      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl p-4 animate-pulse">
                <div className="w-full h-48 bg-gray-200 rounded-2xl mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="text-center py-20">
            <ChefHat className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-600 mb-2">
              لا توجد مطاعم متاحة
            </h3>
            <p className="text-gray-500">جرب البحث بكلمات مختلفة</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRestaurants.map((restaurant, index) => {
              const distance = userLocation && restaurant.latitude && restaurant.longitude
                ? calculateDistance(userLocation.lat, userLocation.lng, restaurant.latitude, restaurant.longitude)
                : null;

              return (
                <motion.div
                  key={restaurant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
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
                          <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            مميز
                          </div>
                        )}
                      </div>

                      {/* Restaurant Info */}
                      <div className="p-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                          {restaurant.shop_name_ar || restaurant.shop_name}
                        </h3>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="font-bold">{restaurant.rating?.toFixed(1) || '0.0'}</span>
                            <span className="text-gray-400">({restaurant.reviews_count || 0})</span>
                          </div>
                          
                          {distance && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span>{distance.toFixed(1)} كم</span>
                            </div>
                          )}
                        </div>

                        {restaurant.min_order_amount > 0 && (
                          <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
                            <DollarSign className="w-4 h-4" />
                            الحد الأدنى للطلب: <span className="font-bold text-gray-800">{restaurant.min_order_amount} ₪</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    <Footer />
    </>
  );
}
