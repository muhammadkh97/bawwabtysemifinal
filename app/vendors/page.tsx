'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Star, MapPin, Package, Loader2, Search, Filter, X, Phone, Mail, Globe, Clock, Award, TrendingUp, Users, Heart, Calendar, ShoppingBag, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

interface Vendor {
  id: string;
  name: string;
  name_ar: string;
  logo_url: string | null;
  shop_logo: string | null;
  description: string | null;
  category: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  rating: number;
  reviews_count: number;
  is_featured: boolean;
  opening_hours?: any;
  created_at?: string;
  updated_at?: string;
  products_count?: number;
  followers_count?: number;
  featured_products?: any[];
  is_verified?: boolean;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('rating');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  const categories = [
    { value: 'all', label: 'جميع الفئات', icon: '🏪' },
    { value: 'electronics', label: 'إلكترونيات', icon: '📱' },
    { value: 'fashion', label: 'أزياء', icon: '👔' },
    { value: 'beauty', label: 'تجميل', icon: '💄' },
    { value: 'home', label: 'منزل وديكور', icon: '🏠' },
    { value: 'sports', label: 'رياضة', icon: '⚽' },
    { value: 'books', label: 'كتب', icon: '📚' },
    { value: 'toys', label: 'ألعاب', icon: '🧸' },
    { value: 'jewelry', label: 'مجوهرات', icon: '💎' },
    { value: 'food', label: 'مواد غذائية', icon: '🍎' },
    { value: 'health', label: 'صحة', icon: '💊' },
  ];

  const locations = [
    { value: 'all', label: 'جميع المواقع' },
    { value: 'ramallah', label: 'رام الله' },
    { value: 'nablus', label: 'نابلس' },
    { value: 'hebron', label: 'الخليل' },
    { value: 'bethlehem', label: 'بيت لحم' },
    { value: 'jenin', label: 'جنين' },
    { value: 'tulkarm', label: 'طولكرم' },
    { value: 'qalqilya', label: 'قلقيلية' },
    { value: 'jericho', label: 'أريحا' },
  ];

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('stores')
        .select(`
          id,
          name,
          name_ar,
          logo_url,
          shop_logo,
          description,
          category,
          city,
          address,
          phone,
          email,
          rating,
          reviews_count,
          is_featured,
          opening_hours,
          created_at,
          updated_at
        `)
        .eq('business_type', 'retail')
        .eq('approval_status', 'approved')
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false });

      if (error) {
        throw new Error(`فشل جلب بيانات البائعين: ${error.message}`);
      }

      // Fetch additional data for each vendor
      const vendorsWithData = await Promise.all(
        (data || []).map(async (vendor) => {
          // Get products count
          const { count: productsCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('vendor_id', vendor.id)
            .eq('is_active', true);

          // Get featured products (top 3)
          const { data: featuredProducts } = await supabase
            .from('products')
            .select('id, name, name_ar, price, featured_image, images')
            .eq('vendor_id', vendor.id)
            .eq('is_active', true)
            .order('total_sales', { ascending: false })
            .limit(3);

          // Simulate followers count (يمكن إضافة جدول followers لاحقاً)
          const followersCount = Math.floor(Math.random() * 5000) + 100;

          return {
            ...vendor,
            products_count: productsCount || 0,
            followers_count: followersCount,
            featured_products: featuredProducts || [],
            is_verified: vendor.is_featured || vendor.rating >= 4.5,
          };
        })
      );

      setVendors(vendorsWithData);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'خطأ في جلب بيانات البائعين';
      
      logger.error('fetchVendors failed', {
        error: errorMessage,
        component: 'VendorsPage',
      });
      
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const filteredVendors = vendors
    .filter(vendor => {
      // Search filter
      const matchesSearch = vendor.name_ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category filter
      const matchesCategory = selectedCategory === 'all' || 
        vendor.category?.toLowerCase() === selectedCategory.toLowerCase();
      
      // Rating filter
      const matchesRating = selectedRating === 0 || 
        (vendor.rating || 0) >= selectedRating;
      
      // Location filter
      const matchesLocation = selectedLocation === 'all' || 
        vendor.city?.toLowerCase().includes(selectedLocation.toLowerCase());

      // Featured filter
      const matchesFeatured = !showFeaturedOnly || vendor.is_featured;
      
      return matchesSearch && matchesCategory && matchesRating && matchesLocation && matchesFeatured;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'products') return (b.products_count || 0) - (a.products_count || 0);
      if (sortBy === 'followers') return (b.followers_count || 0) - (a.followers_count || 0);
      if (sortBy === 'newest') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      return 0;
    });

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedRating(0);
    setSelectedLocation('all');
    setSortBy('rating');
    setShowFeaturedOnly(false);
  };

  const activeFiltersCount = [
    selectedCategory !== 'all',
    selectedRating !== 0,
    selectedLocation !== 'all',
    showFeaturedOnly,
  ].filter(Boolean).length;

  const formatOpeningHours = (hours: any) => {
    if (!hours) return 'غير محدد';
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return hours[today] || '9:00-22:00';
  };

  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" dir="rtl">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white py-12 sm:py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <ShoppingBag className="w-8 h-8 sm:w-12 sm:h-12" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-black mb-3 sm:mb-4">
                المتاجر المميزة 🛍️
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-6 sm:mb-8">
                اكتشف أفضل المتاجر الموثوقة واستمتع بتجربة تسوق فريدة
              </p>
              
              {/* Search Bar */}
              <div className="max-w-2xl mx-auto mb-6">
                <div className="relative">
                  <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                  <input
                    type="text"
                    placeholder="ابحث عن متجر..."
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
                  onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
                  className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 backdrop-blur-lg rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${
                    showFeaturedOnly ? 'bg-yellow-400 text-gray-900' : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                  المميزة فقط
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
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">الفئة</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {categories.map((category) => (
                        <button
                          key={category.value}
                          onClick={() => setSelectedCategory(category.value)}
                          className={`px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                            selectedCategory === category.value
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <span className="text-lg mb-1 block">{category.icon}</span>
                          {category.label}
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

                  {/* Location Filter */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">الموقع</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {locations.map((location) => (
                        <button
                          key={location.value}
                          onClick={() => setSelectedLocation(location.value)}
                          className={`px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                            selectedLocation === location.value
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <MapPin className="w-4 h-4 mx-auto mb-1" />
                          {location.label}
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
                        { value: 'products', label: 'عدد المنتجات', icon: Package },
                        { value: 'followers', label: 'المتابعين', icon: Users },
                        { value: 'newest', label: 'الأحدث', icon: Calendar },
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

        {/* Results Count */}
        <div className="container mx-auto px-4 pt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              {loading ? 'جاري التحميل...' : `${filteredVendors.length} متجر متاح`}
            </h2>
          </div>
        </div>

        {/* Vendors Grid */}
        <div className="container mx-auto px-4 pb-12">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl sm:rounded-3xl p-4 animate-pulse">
                  <div className="w-full h-48 bg-gray-200 rounded-xl mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-600 mb-2">
                لا توجد متاجر متاحة
              </h3>
              <p className="text-gray-500 mb-6">جرب تعديل الفلاتر أو البحث بكلمات مختلفة</p>
              {activeFiltersCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold hover:shadow-lg transition-all"
                >
                  إعادة تعيين الفلاتر
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredVendors.map((vendor, index) => {
                const logoUrl = vendor.logo_url || vendor.shop_logo;
                const displayName = vendor.name_ar || vendor.name;
                const description = vendor.description || 'متجر متنوع لجميع احتياجاتك';

                return (
                  <motion.div
                    key={vendor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group"
                  >
                    {/* Header with Logo */}
                    <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-6 text-center">
                      {/* Badges */}
                      <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
                        {vendor.is_featured && (
                          <div className="bg-yellow-400 text-gray-900 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                            <Award className="w-3 h-3" />
                            <span className="hidden sm:inline">مميز</span>
                          </div>
                        )}
                        {vendor.is_verified && (
                          <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                            <Sparkles className="w-3 h-3" />
                            <span className="hidden sm:inline">موثوق</span>
                          </div>
                        )}
                      </div>

                      {logoUrl ? (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 rounded-full overflow-hidden bg-white border-4 border-white/50 shadow-xl group-hover:scale-110 transition-transform">
                          <img src={logoUrl} alt={displayName} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="text-4xl sm:text-6xl mb-3">🏪</div>
                      )}
                      <h3 className="text-xl sm:text-2xl font-black text-white mb-2">{displayName}</h3>
                      
                      {/* Rating */}
                      {vendor.rating > 0 && (
                        <div className="flex items-center justify-center gap-1 text-yellow-300">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="font-bold">{vendor.rating.toFixed(1)}</span>
                          <span className="text-white/70 text-sm">({vendor.reviews_count || 0})</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-6">
                      <p className="text-gray-600 text-sm sm:text-base mb-4 line-clamp-2">{description}</p>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center gap-2 text-sm bg-purple-50 rounded-lg px-3 py-2">
                          <Package className="w-4 h-4 text-purple-600" />
                          <span className="text-gray-700 font-bold">{vendor.products_count || 0} منتج</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm bg-pink-50 rounded-lg px-3 py-2">
                          <Users className="w-4 h-4 text-pink-600" />
                          <span className="text-gray-700 font-bold">{vendor.followers_count || 0}</span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="space-y-2 mb-4 text-sm">
                        {vendor.city && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span className="line-clamp-1">{vendor.address || vendor.city}</span>
                          </div>
                        )}
                        
                        {vendor.phone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="w-4 h-4" />
                            <a href={`tel:${vendor.phone}`} className="hover:text-purple-600 transition-colors">
                              {vendor.phone}
                            </a>
                          </div>
                        )}
                        
                        {vendor.opening_hours && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{formatOpeningHours(vendor.opening_hours)}</span>
                          </div>
                        )}

                        {vendor.updated_at && (
                          <div className="flex items-center gap-2 text-gray-400 text-xs">
                            <Calendar className="w-3 h-3" />
                            <span>آخر تحديث: {new Date(vendor.updated_at).toLocaleDateString('ar-EG')}</span>
                          </div>
                        )}
                      </div>

                      {/* Featured Products Preview */}
                      {vendor.featured_products && vendor.featured_products.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-bold text-gray-500 mb-2">منتجات مميزة:</p>
                          <div className="flex gap-2">
                            {vendor.featured_products.slice(0, 3).map((product: any) => (
                              <div key={product.id} className="flex-1">
                                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                  <img 
                                    src={product.featured_image || product.images?.[0] || '/placeholder.png'} 
                                    alt={product.name_ar || product.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Link
                          href={`/vendors/${vendor.id}`}
                          className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-xl transition-all text-center text-sm sm:text-base"
                        >
                          زيارة المتجر
                        </Link>
                        <button className="w-12 h-12 bg-gray-100 hover:bg-pink-100 rounded-xl flex items-center justify-center transition-all group">
                          <Heart className="w-5 h-5 text-gray-600 group-hover:text-pink-600 group-hover:fill-pink-600 transition-all" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
