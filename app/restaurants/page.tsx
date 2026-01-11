'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { MapPin, Star, Clock, ChefHat, Search, Filter, DollarSign, Map as MapIcon, X, Sparkles, TrendingUp, Flame, Tag, Award } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { logger } from '@/lib/logger';

interface Restaurant {
  id: string;
  name: string;
  name_ar: string;
  shop_logo: string;
  rating: number;
  reviews_count: number;
  latitude: number;
  longitude: number;
  min_order_amount: number;
  is_featured: boolean;
  cuisine_type?: string;
  delivery_time?: string;
  delivery_fee?: number;
  has_offers?: boolean;
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  
  // Filters State
  const [selectedCuisine, setSelectedCuisine] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [selectedDeliveryTime, setSelectedDeliveryTime] = useState<string>('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('rating');

  const cuisineTypes = [
    { value: 'all', label: 'جميع المطابخ', icon: '🍽️' },
    { value: 'arabic', label: 'عربي', icon: '🥙' },
    { value: 'italian', label: 'إيطالي', icon: '🍕' },
    { value: 'chinese', label: 'صيني', icon: '🥡' },
    { value: 'american', label: 'أمريكي', icon: '🍔' },
    { value: 'indian', label: 'هندي', icon: '🍛' },
    { value: 'japanese', label: 'ياباني', icon: '🍱' },
    { value: 'mexican', label: 'مكسيكي', icon: '🌮' },
    { value: 'seafood', label: 'مأكولات بحرية', icon: '🦞' },
    { value: 'grill', label: 'مشاوي', icon: '🍖' },
    { value: 'desserts', label: 'حلويات', icon: '🍰' },
  ];

  const deliveryTimes = [
    { value: 'all', label: 'جميع الأوقات' },
    { value: 'fast', label: 'سريع (15-25 دقيقة)' },
    { value: 'medium', label: 'متوسط (25-40 دقيقة)' },
    { value: 'slow', label: 'بطيء (40+ دقيقة)' },
  ];

  const priceRanges = [
    { value: 'all', label: 'جميع الأسعار' },
    { value: 'low', label: 'اقتصادي (0-20 ₪)' },
    { value: 'medium', label: 'متوسط (20-50 ₪)' },
    { value: 'high', label: 'فاخر (50+ ₪)' },
  ];

  useEffect(() => {
    fetchRestaurants();
    getUserLocation();
  }, []);

  useEffect(() => {
    if (showMap && mapRef.current && userLocation) {
      initializeMap();
    }
  }, [showMap, userLocation, restaurants, searchQuery, selectedCuisine, selectedRating, selectedDeliveryTime, selectedPriceRange, sortBy]);

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
          logger.error('Error getting location', {
            error: error.message,
            component: 'RestaurantsPage',
          });
        }
      );
    }
  };

  const fetchRestaurants = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select(`
          id, 
          name, 
          name_ar, 
          shop_logo, 
          rating, 
          reviews_count, 
          latitude, 
          longitude, 
          min_order_amount, 
          is_featured,
          cuisine_type,
          delivery_time,
          delivery_fee
        `)
        .eq('approval_status', 'approved')
        .eq('business_type', 'restaurant')
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false });

      if (error) {
        throw new Error(`فشل جلب المطاعم: ${error.message}`);
      }
      
      // Check if restaurants have active offers
      const restaurantData = await Promise.all((data || []).map(async (restaurant) => {
        const { data: offersData } = await supabase
          .from('products')
          .select('id')
          .eq('vendor_id', restaurant.id)
          .not('old_price', 'is', null)
          .gt('stock', 0)
          .limit(1);
        
        return {
          ...restaurant,
          has_offers: (offersData && offersData.length > 0) || false
        };
      }));
      
      setRestaurants(restaurantData);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'خطأ في جلب المطاعم';
      
      logger.error('fetchRestaurants failed', {
        error: errorMessage,
        component: 'RestaurantsPage',
      });
      
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  }, []);

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

  const filteredRestaurants = restaurants
    .filter(restaurant => {
      // Search filter
      const matchesSearch = restaurant.name_ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Cuisine filter
      const matchesCuisine = selectedCuisine === 'all' || 
        restaurant.cuisine_type?.toLowerCase() === selectedCuisine.toLowerCase();
      
      // Rating filter
      const matchesRating = selectedRating === 0 || 
        (restaurant.rating || 0) >= selectedRating;
      
      // Delivery time filter
      let matchesDeliveryTime = true;
      if (selectedDeliveryTime !== 'all' && restaurant.delivery_time) {
        const time = parseInt(restaurant.delivery_time);
        if (selectedDeliveryTime === 'fast') matchesDeliveryTime = time <= 25;
        else if (selectedDeliveryTime === 'medium') matchesDeliveryTime = time > 25 && time <= 40;
        else if (selectedDeliveryTime === 'slow') matchesDeliveryTime = time > 40;
      }
      
      // Price range filter
      let matchesPriceRange = true;
      if (selectedPriceRange !== 'all') {
        const minOrder = restaurant.min_order_amount || 0;
        if (selectedPriceRange === 'low') matchesPriceRange = minOrder <= 20;
        else if (selectedPriceRange === 'medium') matchesPriceRange = minOrder > 20 && minOrder <= 50;
        else if (selectedPriceRange === 'high') matchesPriceRange = minOrder > 50;
      }
      
      return matchesSearch && matchesCuisine && matchesRating && matchesDeliveryTime && matchesPriceRange;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'reviews') return (b.reviews_count || 0) - (a.reviews_count || 0);
      if (sortBy === 'price') return (a.min_order_amount || 0) - (b.min_order_amount || 0);
      if (sortBy === 'distance' && userLocation) {
        const distanceA = a.latitude && a.longitude ? calculateDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude) : 999;
        const distanceB = b.latitude && b.longitude ? calculateDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude) : 999;
        return distanceA - distanceB;
      }
      return 0;
    });

  const resetFilters = () => {
    setSelectedCuisine('all');
    setSelectedRating(0);
    setSelectedDeliveryTime('all');
    setSelectedPriceRange('all');
    setSortBy('rating');
  };

  const activeFiltersCount = [
    selectedCuisine !== 'all',
    selectedRating !== 0,
    selectedDeliveryTime !== 'all',
    selectedPriceRange !== 'all',
  ].filter(Boolean).length;

  const initializeMap = () => {
    if (!mapRef.current || !userLocation) return;

    // Calculate filtered restaurants inside the function
    const filtered = restaurants
      .filter(restaurant => {
        const matchesSearch = restaurant.name_ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          restaurant.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCuisine = selectedCuisine === 'all' || 
          restaurant.cuisine_type?.toLowerCase() === selectedCuisine.toLowerCase();
        const matchesRating = selectedRating === 0 || (restaurant.rating || 0) >= selectedRating;
        return matchesSearch && matchesCuisine && matchesRating;
      });

    // Simple map placeholder - يمكن استبداله بـ Google Maps أو Leaflet
    mapRef.current.innerHTML = `
      <div class="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center relative overflow-hidden">
        <div class="absolute inset-0 opacity-20">
          <div class="absolute w-full h-full" style="background-image: url('data:image/svg+xml,<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; viewBox=&quot;0 0 100 100&quot;><line x1=&quot;0&quot; y1=&quot;50&quot; x2=&quot;100&quot; y2=&quot;50&quot; stroke=&quot;%23333&quot; stroke-width=&quot;0.5&quot;/><line x1=&quot;50&quot; y1=&quot;0&quot; x2=&quot;50&quot; y2=&quot;100&quot; stroke=&quot;%23333&quot; stroke-width=&quot;0.5&quot;/></svg>'); background-size: 50px 50px;"></div>
        </div>
        <div class="relative z-10 text-center p-8">
          <div class="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce">
            <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">موقعك الحالي</h3>
          <p class="text-gray-600 mb-4">${filtered.length} مطعم قريب منك</p>
          <div class="flex flex-wrap gap-2 justify-center">
            ${filtered.slice(0, 5).map(r => `
              <div class="px-3 py-1 bg-white rounded-full text-sm font-bold text-gray-700 shadow">
                📍 ${r.name_ar}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50" dir="rtl">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white py-12 sm:py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <ChefHat className="w-8 h-8 sm:w-12 sm:h-12" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-black mb-3 sm:mb-4">
                استكشف أفضل المطاعم 🍽️
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-6 sm:mb-8">
                اطلب وجباتك المفضلة من آلاف المطاعم المميزة
              </p>
              
              {/* Search Bar */}
              <div className="max-w-2xl mx-auto mb-6">
                <div className="relative">
                  <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                  <input
                    type="text"
                    placeholder="ابحث عن مطعم..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-12 sm:pr-14 pl-4 sm:pl-6 py-3 sm:py-5 rounded-2xl text-gray-900 text-base sm:text-lg focus:outline-none focus:ring-4 focus:ring-white/50"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="relative w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white/20 backdrop-blur-lg hover:bg-white/30 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                  الفلاتر
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 text-gray-900 rounded-full text-xs flex items-center justify-center font-black">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => setShowMap(!showMap)}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white/20 backdrop-blur-lg hover:bg-white/30 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <MapIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  {showMap ? 'إخفاء الخريطة' : 'عرض الخريطة'}
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Filters Section */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white border-b border-gray-200 overflow-hidden"
            >
              <div className="container mx-auto px-4 py-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-black text-gray-900">الفلاتر المتقدمة</h3>
                  <div className="flex gap-3">
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={resetFilters}
                        className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-700 transition-all"
                      >
                        إعادة تعيين
                      </button>
                    )}
                    <button
                      onClick={() => setShowFilters(false)}
                      className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Cuisine Type Filter */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">نوع المطبخ</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {cuisineTypes.map((cuisine) => (
                        <button
                          key={cuisine.value}
                          onClick={() => setSelectedCuisine(cuisine.value)}
                          className={`px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                            selectedCuisine === cuisine.value
                              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg scale-105'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <span className="text-lg mb-1 block">{cuisine.icon}</span>
                          {cuisine.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">التقييم</label>
                    <div className="flex gap-3 flex-wrap">
                      {[0, 3, 4, 4.5, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setSelectedRating(rating)}
                          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                            selectedRating === rating
                              ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 shadow-lg scale-105'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Star className="w-4 h-4 fill-current" />
                          {rating === 0 ? 'الكل' : `${rating}+`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Time Filter */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">وقت التوصيل</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {deliveryTimes.map((time) => (
                        <button
                          key={time.value}
                          onClick={() => setSelectedDeliveryTime(time.value)}
                          className={`px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                            selectedDeliveryTime === time.value
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Clock className="w-4 h-4 mx-auto mb-1" />
                          {time.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range Filter */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">نطاق السعر</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {priceRanges.map((range) => (
                        <button
                          key={range.value}
                          onClick={() => setSelectedPriceRange(range.value)}
                          className={`px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                            selectedPriceRange === range.value
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg scale-105'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <DollarSign className="w-4 h-4 mx-auto mb-1" />
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">ترتيب حسب</label>
                    <div className="flex gap-3 flex-wrap">
                      {[
                        { value: 'rating', label: 'التقييم', icon: Star },
                        { value: 'reviews', label: 'عدد المراجعات', icon: TrendingUp },
                        { value: 'price', label: 'السعر', icon: DollarSign },
                        { value: 'distance', label: 'المسافة', icon: MapPin },
                      ].map((sort) => (
                        <button
                          key={sort.value}
                          onClick={() => setSortBy(sort.value)}
                          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                            sortBy === sort.value
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <sort.icon className="w-4 h-4" />
                          {sort.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Map Section */}
        <AnimatePresence>
          {showMap && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 400, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-gray-200 overflow-hidden"
            >
              <div className="container mx-auto px-4 py-6">
                <div className="relative h-full" ref={mapRef}>
                  <div className="w-full h-full bg-gray-100 rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <MapIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-bold">جاري تحميل الخريطة...</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Count */}
        <div className="container mx-auto px-4 pt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              {loading ? 'جاري التحميل...' : `${filteredRestaurants.length} مطعم متاح`}
            </h2>
          </div>
        </div>

        {/* Restaurants Grid */}
        <div className="container mx-auto px-4 pb-12">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 animate-pulse">
                  <div className="w-full h-32 sm:h-48 bg-gray-200 rounded-xl sm:rounded-2xl mb-3 sm:mb-4"></div>
                  <div className="h-4 sm:h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="text-center py-20">
              <ChefHat className="w-24 h-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-600 mb-2">
                لا توجد مطاعم متاحة
              </h3>
              <p className="text-gray-500 mb-6">جرب تعديل الفلاتر أو البحث بكلمات مختلفة</p>
              {activeFiltersCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl font-bold hover:shadow-lg transition-all"
                >
                  إعادة تعيين الفلاتر
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
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
                      <div className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group cursor-pointer">
                        {/* Restaurant Image */}
                        <div className="relative h-32 sm:h-48 overflow-hidden">
                          {restaurant.shop_logo ? (
                            <img
                              src={restaurant.shop_logo}
                              alt={restaurant.name_ar}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                              <ChefHat className="w-12 h-12 sm:w-20 sm:h-20 text-white opacity-50" />
                            </div>
                          )}
                          
                          {/* Badges */}
                          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex flex-col gap-2">
                            {restaurant.is_featured && (
                              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1 shadow-lg">
                                <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                <span className="hidden sm:inline">مميز</span>
                              </div>
                            )}
                            
                            {restaurant.has_offers && (
                              <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 rounded-full text-[10px] sm:text-xs font-bold flex items-center gap-1 shadow-lg animate-pulse">
                                <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                <span className="hidden sm:inline">عروض</span>
                              </div>
                            )}
                          </div>

                          {/* Rating Badge */}
                          {restaurant.rating > 0 && (
                            <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-current" />
                              <span className="text-[10px] sm:text-sm font-black text-gray-900">
                                {restaurant.rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Restaurant Info */}
                        <div className="p-2 sm:p-4">
                          {/* Cuisine Type Badge */}
                          {restaurant.cuisine_type && (
                            <div className="inline-block px-2 py-0.5 sm:px-3 sm:py-1 bg-orange-50 border border-orange-200 rounded-full mb-1 sm:mb-2">
                              <span className="text-[9px] sm:text-xs text-orange-600 font-bold">
                                {cuisineTypes.find(c => c.value === restaurant.cuisine_type?.toLowerCase())?.label || restaurant.cuisine_type}
                              </span>
                            </div>
                          )}

                          <h3 className="text-sm sm:text-lg md:text-xl font-bold text-gray-900 mb-1 sm:mb-2 group-hover:text-orange-600 transition-colors line-clamp-1">
                            {restaurant.name_ar || restaurant.name}
                          </h3>
                          
                          <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-sm text-gray-600 mb-2 sm:mb-3 flex-wrap">
                            {restaurant.reviews_count > 0 && (
                              <div className="flex items-center gap-0.5 sm:gap-1">
                                <span className="text-gray-400">({restaurant.reviews_count})</span>
                              </div>
                            )}
                            
                            {distance && (
                              <div className="flex items-center gap-0.5 sm:gap-1">
                                <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400" />
                                <span>{distance.toFixed(1)} كم</span>
                              </div>
                            )}

                            {restaurant.delivery_time && (
                              <div className="flex items-center gap-0.5 sm:gap-1">
                                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400" />
                                <span>{restaurant.delivery_time} د</span>
                              </div>
                            )}
                          </div>

                          {restaurant.min_order_amount > 0 && (
                            <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm text-gray-500 bg-gray-50 rounded-lg sm:rounded-xl px-2 py-1 sm:px-3 sm:py-2">
                              <DollarSign className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              <span className="hidden sm:inline">الحد الأدنى:</span>
                              <span className="font-bold text-gray-800">{restaurant.min_order_amount} ₪</span>
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
