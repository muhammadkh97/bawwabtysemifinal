'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Zap, Tag, TrendingUp, Percent, ArrowRight, Filter, 
  Heart, Share2, Bell, Flame, Star, ChevronDown, X, 
  Smartphone, ShirtIcon as Shirt, Home, Package, TrendingDown,
  DollarSign, AlertCircle, CheckCircle, Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import LuckyBoxComponent from '@/components/LuckyBoxComponent';

interface Deal {
  id: string;
  title: string;
  title_ar: string;
  discount: number;
  discount_percentage: number;
  icon: string;
  products: number;
  hours: number;
  minutes: number;
  seconds: number;
  gradient: string;
  end_date: string;
  category?: string;
  rating?: number;
  original_price?: number;
  final_price?: number;
  saved_amount?: number;
  is_hot?: boolean;
  is_ending_soon?: boolean;
  is_favorited?: boolean;
}

// Categories data
const categories = [
  { id: 'all', name: 'الكل', icon: Package, color: 'from-purple-500 to-pink-500' },
  { id: 'electronics', name: 'إلكترونيات', icon: Smartphone, color: 'from-blue-500 to-cyan-500' },
  { id: 'fashion', name: 'ملابس', icon: Shirt, color: 'from-pink-500 to-rose-500' },
  { id: 'home', name: 'منزل', icon: Home, color: 'from-green-500 to-emerald-500' },
  { id: 'sports', name: 'رياضة', icon: TrendingUp, color: 'from-orange-500 to-red-500' },
];

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [discountRange, setDiscountRange] = useState({ min: 0, max: 100 });
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'discount' | 'price' | 'rating' | 'ending'>('discount');
  
  // Favorites
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // جلب العروض من قاعدة البيانات
  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('deals')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching deals:', fetchError);
        setError('فشل تحميل العروض. يرجى المحاولة مرة أخرى.');
        return;
      }

      // تحويل البيانات إلى الشكل المطلوب
      const formattedDeals = (data || []).map(deal => {
        const timeRemaining = calculateTimeRemaining(deal.end_date);
        const hoursLeft = timeRemaining.hours + (timeRemaining.minutes / 60);
        
        return {
          id: deal.id,
          title: deal.title,
          title_ar: deal.title_ar,
          discount: deal.discount_percentage,
          discount_percentage: deal.discount_percentage,
          icon: '🎁',
          products: Math.floor(Math.random() * 50) + 10,
          hours: timeRemaining.hours,
          minutes: timeRemaining.minutes,
          seconds: timeRemaining.seconds,
          gradient: 'from-purple-600 to-pink-600',
          end_date: deal.end_date,
          category: ['electronics', 'fashion', 'home', 'sports'][Math.floor(Math.random() * 4)],
          rating: Math.floor(Math.random() * 2) + 3.5,
          original_price: Math.floor(Math.random() * 500) + 100,
          final_price: 0,
          saved_amount: 0,
          is_hot: deal.discount_percentage >= 50,
          is_ending_soon: hoursLeft < 12,
          is_favorited: false,
        };
      }).map(deal => ({
        ...deal,
        final_price: Math.floor(deal.original_price! * (1 - deal.discount / 100)),
        saved_amount: Math.floor(deal.original_price! * (deal.discount / 100))
      }));

      setDeals(formattedDeals);
      setFilteredDeals(formattedDeals);
    } catch (error) {
      console.error('Error fetching deals:', error);
      setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeRemaining = (endDate: string) => {
    const now = new Date().getTime();
    const end = new Date(endDate).getTime();
    const diff = Math.max(0, end - now);

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds };
  };

  // تحديث العد التنازلي
  useEffect(() => {
    const interval = setInterval(() => {
      setDeals(prevDeals => 
        prevDeals.map(deal => {
          let { hours, minutes, seconds } = deal;
          
          if (seconds > 0) {
            seconds--;
          } else if (minutes > 0) {
            minutes--;
            seconds = 59;
          } else if (hours > 0) {
            hours--;
            minutes = 59;
            seconds = 59;
          }
          
          const hoursLeft = hours + (minutes / 60);
          
          return { 
            ...deal, 
            hours, 
            minutes, 
            seconds,
            is_ending_soon: hoursLeft < 12
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...deals];
    
    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(deal => deal.category === selectedCategory);
    }
    
    // Discount filter
    filtered = filtered.filter(deal => 
      deal.discount >= discountRange.min && deal.discount <= discountRange.max
    );
    
    // Price filter
    filtered = filtered.filter(deal => 
      deal.final_price! >= priceRange.min && deal.final_price! <= priceRange.max
    );
    
    // Rating filter
    filtered = filtered.filter(deal => deal.rating! >= minRating);
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'discount':
          return b.discount - a.discount;
        case 'price':
          return (a.final_price || 0) - (b.final_price || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'ending':
          return (a.hours * 60 + a.minutes) - (b.hours * 60 + b.minutes);
        default:
          return 0;
      }
    });
    
    setFilteredDeals(filtered);
  }, [deals, selectedCategory, discountRange, priceRange, minRating, sortBy]);

  // Toggle favorite
  const toggleFavorite = (dealId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(dealId)) {
        newFavorites.delete(dealId);
      } else {
        newFavorites.add(dealId);
      }
      return newFavorites;
    });
  };

  // Share deal
  const shareDeal = async (deal: Deal) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: deal.title_ar,
          text: `خصم ${deal.discount}% على ${deal.title_ar}`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('تم نسخ الرابط!');
    }
  };

  // Calculate statistics
  const stats = {
    totalDeals: filteredDeals.length,
    totalSavings: filteredDeals.reduce((sum, deal) => sum + (deal.saved_amount || 0), 0),
    totalProducts: filteredDeals.reduce((sum, deal) => sum + deal.products, 0)
  };

  return (
    <div className="min-h-screen" style={{ background: '#0A0515' }}>
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* العنوان */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="text-7xl mb-4">🔥</div>
          <h1 className="text-6xl font-bold mb-4"
            style={{
              background: 'linear-gradient(90deg, #6236FF 0%, #B621FE 50%, #FF219D 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
            العروض الخاصة
          </h1>
          <p className="text-purple-300 text-xl mb-6">
            خصومات تصل إلى 70% على منتجات مختارة
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full"
            style={{
              background: 'rgba(255, 193, 7, 0.1)',
              border: '1px solid rgba(255, 193, 7, 0.3)'
            }}>
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 font-bold">عروض لفترة محدودة!</span>
          </div>
        </motion.div>

        {/* Lucky Boxes Section */}
        <LuckyBoxComponent />

        {/* Statistics Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <div className="p-6 rounded-2xl backdrop-blur-xl border border-purple-500/30"
            style={{ background: 'rgba(98, 54, 255, 0.1)' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Tag className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-purple-300 text-sm">العروض المتاحة</p>
                <p className="text-white text-2xl font-bold">{stats.totalDeals}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 rounded-2xl backdrop-blur-xl border border-green-500/30"
            style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-green-300 text-sm">إجمالي التوفير</p>
                <p className="text-white text-2xl font-bold">{stats.totalSavings} د.أ</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 rounded-2xl backdrop-blur-xl border border-blue-500/30"
            style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-blue-300 text-sm">المنتجات المشمولة</p>
                <p className="text-white text-2xl font-bold">{stats.totalProducts}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Categories Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-white text-xl font-bold">التصنيفات</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="mr-auto px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-purple-500/30 text-purple-200 hover:bg-white/20 transition-all flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              <span>فلاتر متقدمة</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {categories.map(cat => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <motion.button
                  key={cat.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl backdrop-blur-sm transition-all whitespace-nowrap ${
                    isActive 
                      ? 'bg-gradient-to-r ' + cat.color + ' text-white border-2 border-white/20' 
                      : 'bg-white/10 text-purple-300 border border-purple-500/30 hover:bg-white/20'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{cat.name}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 p-6 rounded-2xl backdrop-blur-xl border border-purple-500/30 overflow-hidden"
              style={{ background: 'rgba(15, 10, 30, 0.6)' }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Discount Range */}
                <div>
                  <label className="block text-white font-medium mb-3 flex items-center gap-2">
                    <Percent className="w-4 h-4" />
                    نسبة الخصم
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={discountRange.max}
                      onChange={(e) => setDiscountRange({ ...discountRange, max: parseInt(e.target.value) })}
                      className="w-full accent-purple-500"
                    />
                    <div className="flex justify-between text-purple-300 text-sm">
                      <span>{discountRange.min}%</span>
                      <span>{discountRange.max}%</span>
                    </div>
                  </div>
                </div>
                
                {/* Price Range */}
                <div>
                  <label className="block text-white font-medium mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    السعر
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      step="100"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
                      className="w-full accent-purple-500"
                    />
                    <div className="flex justify-between text-purple-300 text-sm">
                      <span>{priceRange.min} د.أ</span>
                      <span>{priceRange.max} د.أ</span>
                    </div>
                  </div>
                </div>
                
                {/* Rating */}
                <div>
                  <label className="block text-white font-medium mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    التقييم
                  </label>
                  <div className="flex gap-2">
                    {[0, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setMinRating(rating)}
                        className={`px-4 py-2 rounded-lg transition-all ${
                          minRating === rating
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                            : 'bg-white/10 text-purple-300 hover:bg-white/20'
                        }`}
                      >
                        {rating === 0 ? 'الكل' : `${rating}+`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Sort By */}
              <div className="mt-6 pt-6 border-t border-purple-500/20">
                <label className="block text-white font-medium mb-3">الترتيب حسب</label>
                <div className="flex gap-2">
                  {[
                    { value: 'discount', label: 'الخصم' },
                    { value: 'price', label: 'السعر' },
                    { value: 'rating', label: 'التقييم' },
                    { value: 'ending', label: 'الأقرب للانتهاء' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value as any)}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        sortBy === option.value
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                          : 'bg-white/10 text-purple-300 hover:bg-white/20'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-purple-300 text-lg">جاري تحميل العروض...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">😞</div>
            <p className="text-purple-300 text-xl mb-4">{error}</p>
            <button 
              onClick={fetchDeals}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:shadow-lg transition"
            >
              حاول مرة أخرى
            </button>
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎁</div>
            <p className="text-purple-300 text-xl">لا توجد عروض متاحة حالياً</p>
          </div>
        ) : (
          <>
        {/* شبكة العروض */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {filteredDeals.map((deal, index) => {
            const isFavorited = favorites.has(deal.id);
            const isEndingSoon = deal.is_ending_soon;
            const isHot = deal.is_hot;
            
            return (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group rounded-3xl overflow-hidden relative"
              style={{
                background: 'rgba(15, 10, 30, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(98, 54, 255, 0.3)'
              }}
            >
              {/* Badges */}
              <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                {isHot && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold shadow-lg"
                  >
                    <Flame className="w-4 h-4" />
                    <span>عرض ساخن</span>
                  </motion.div>
                )}
                {isEndingSoon && (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-sm font-bold shadow-lg"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>ينتهي قريباً</span>
                  </motion.div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="absolute top-4 right-4 z-20 flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggleFavorite(deal.id)}
                  className={`w-10 h-10 rounded-full backdrop-blur-xl flex items-center justify-center transition-all ${
                    isFavorited 
                      ? 'bg-red-500 text-white' 
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => shareDeal(deal)}
                  className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center text-white hover:bg-white/30 transition-all"
                >
                  <Share2 className="w-5 h-5" />
                </motion.button>
                
                {isEndingSoon && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => alert('سيتم إرسال إشعار عند انتهاء العرض!')}
                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center text-white hover:bg-white/30 transition-all"
                  >
                    <Bell className="w-5 h-5" />
                  </motion.button>
                )}
              </div>

              {/* الرأس */}
              <div className="p-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <div className={`absolute inset-0 bg-gradient-to-r ${deal.gradient}`}></div>
                </div>
                
                <div className="relative z-10 flex items-start justify-between mb-6">
                  <div>
                    <div className="text-6xl mb-3">{deal.icon}</div>
                    <h3 className="text-3xl font-bold text-white mb-2">{deal.title_ar}</h3>
                    <p className="text-purple-300 mb-3">{deal.title}</p>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < Math.floor(deal.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`}
                          />
                        ))}
                      </div>
                      <span className="text-purple-300 text-sm">{deal.rating?.toFixed(1)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-purple-300">
                      <Tag className="w-4 h-4" />
                      <span>{deal.products} منتج</span>
                    </div>
                  </div>
                  
                  <div className="px-6 py-3 rounded-2xl text-white backdrop-blur-xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(98, 54, 255, 0.3), rgba(255, 33, 157, 0.3))',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                    <div className="text-sm opacity-80 mb-1">خصم</div>
                    <div className="text-4xl font-bold flex items-center gap-1">
                      {deal.discount}
                      <Percent className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                {/* Price Info */}
                <div className="relative z-10 mb-6 p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-300 text-sm mb-1">السعر بعد الخصم</p>
                      <p className="text-white text-3xl font-bold">{deal.final_price} د.أ</p>
                    </div>
                    <div className="text-right">
                      <p className="text-purple-300 text-sm line-through">{deal.original_price} د.أ</p>
                      <p className="text-green-400 font-bold flex items-center gap-1">
                        <TrendingDown className="w-4 h-4" />
                        وفّر {deal.saved_amount} د.أ
                      </p>
                    </div>
                  </div>
                </div>

                {/* العد التنازلي */}
                <div className="grid grid-cols-3 gap-3 relative z-10">
                  <motion.div 
                    animate={{ scale: deal.seconds % 2 === 0 ? 1 : 1.05 }}
                    transition={{ duration: 0.5 }}
                    className="text-center p-3 rounded-xl backdrop-blur-xl"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                    <div className="text-3xl font-bold text-white mb-1">
                      {String(deal.hours).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-purple-300">ساعة</div>
                  </motion.div>
                  <motion.div 
                    animate={{ scale: deal.seconds % 2 === 0 ? 1 : 1.05 }}
                    transition={{ duration: 0.5 }}
                    className="text-center p-3 rounded-xl backdrop-blur-xl"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                    <div className="text-3xl font-bold text-white mb-1">
                      {String(deal.minutes).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-purple-300">دقيقة</div>
                  </motion.div>
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.1, 1],
                      background: [
                        'rgba(255, 255, 255, 0.05)',
                        'rgba(255, 33, 157, 0.2)',
                        'rgba(255, 255, 255, 0.05)'
                      ]
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-center p-3 rounded-xl backdrop-blur-xl"
                    style={{
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                    <div className="text-3xl font-bold text-white mb-1">
                      {String(deal.seconds).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-purple-300">ثانية</div>
                  </motion.div>
                </div>
              </div>

              {/* زر */}
              <div className="p-6">
                <Link
                  href={`/products?deal=${deal.id}`}
                  className="block w-full py-4 rounded-xl text-white text-center font-bold transition-all hover:shadow-lg hover:shadow-purple-500/50 group-hover:scale-[1.02] flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(90deg, #6236FF, #FF219D)' }}
                >
                  <Sparkles className="w-5 h-5" />
                  <span>تسوق الآن</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </motion.div>
          )})}
        </div>

        {/* عروض الفلاش */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-3xl p-12 text-center relative overflow-hidden"
          style={{
            background: 'rgba(15, 10, 30, 0.6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(98, 54, 255, 0.3)'
          }}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(90deg, #FFD700, #FFA500)'
            }}></div>
          </div>
          
          <div className="relative z-10">
            <div className="text-7xl mb-6">⚡</div>
            <h2 className="text-5xl font-bold text-white mb-4">عروض الفلاش</h2>
            <p className="text-2xl text-purple-200 mb-8">
              خصومات كبيرة لفترة قصيرة جداً - لا تفوت الفرصة!
            </p>
            
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="flex items-center gap-2 text-yellow-400">
                <TrendingUp className="w-6 h-6" />
                <span className="text-xl font-bold">أكثر من 500 منتج</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
              <div className="flex items-center gap-2 text-yellow-400">
                <Clock className="w-6 h-6" />
                <span className="text-xl font-bold">ينتهي خلال 24 ساعة</span>
              </div>
            </div>

            <Link
              href="/products?flash=true"
              className="inline-block px-12 py-5 rounded-xl text-white text-xl font-bold transition-all hover:shadow-2xl hover:shadow-yellow-500/50 hover:scale-105"
              style={{ background: 'linear-gradient(90deg, #FFD700, #FFA500)' }}
            >
              اكتشف العروض الآن
            </Link>
          </div>
        </motion.div>
        </>
        )}
      </div>

      <Footer />
    </div>
  );
}

