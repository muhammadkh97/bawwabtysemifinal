'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { MapPin, Star, Clock, ChefHat, Search, Filter, DollarSign, Map as MapIcon, X, Sparkles, TrendingUp, Flame } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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

      if (error) throw error;
      
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

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
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

      {/* Restaurants Grid */}
      <div className="container mx-auto px-4 py-8 sm:py-12">
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
                            alt={restaurant.name_ar}
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
                          {restaurant.name_ar || restaurant.name}
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
