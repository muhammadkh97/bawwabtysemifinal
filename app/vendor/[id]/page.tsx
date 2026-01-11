'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { 
  MapPin, Star, Clock, Phone, ChefHat, Package, 
  ArrowRight, ShoppingCart, Heart, Share2, Info, Utensils,
  Search, Filter, ChevronDown, DollarSign
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCart } from '@/contexts/CartContext';
import { useRestaurantCart } from '@/contexts/RestaurantCartContext';

interface Vendor {
  id: string;
  name: string;
  name_ar: string;
  shop_logo: string;
  shop_banner: string;
  shop_description: string;
  shop_description_ar: string;
  business_type: 'shop' | 'restaurant';
  rating: number;
  reviews_count: number;
  latitude: number;
  longitude: number;
  min_order_amount: number;
  is_featured: boolean;
  is_online: boolean;
  store_phone: string;
  store_address: string;
}

interface Product {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  price: number;
  sale_price: number;
  images: string[];
  category_id: string;
  is_active: boolean;
  stock: number;
}

export default function VendorDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;
  const { formatPrice } = useCurrency();
  const { addToCart } = useCart();
  const { addToRestaurantCart } = useRestaurantCart();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'about'>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRestaurant, setIsRestaurant] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    if (vendorId) {
      fetchVendorDetails();
      fetchVendorProducts();
    }
  }, [vendorId]);

  const fetchVendorDetails = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', vendorId)
        .eq('approval_status', 'approved')
        .single();

      if (error) {
        throw new Error(`فشل جلب بيانات البائع: ${error.message}`);
      }
      
      setVendor(data);
      setIsRestaurant(data?.business_type === 'restaurant');
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'خطأ في جلب بيانات البائع';
      
      logger.error('fetchVendorDetails failed', {
        error: errorMessage,
        component: 'VendorDetailsPage',
        vendorId,
      });
      
      router.push('/404');
    } finally {
      setLoading(false);
    }
  }, [vendorId, router]);

  const fetchVendorProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching products', { error: errorMessage, component: 'VendorPage', vendorId });
    }
  };

  const filteredProducts = products.filter(p => 
    (p.name_ar || p.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.description_ar || p.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // دالة لإضافة المنتج للسلة المناسبة
  const handleAddToCart = async (productId: string) => {
    if (isRestaurant && vendorId) {
      await addToRestaurantCart(productId, vendorId, 1);
    } else {
      await addToCart(productId, 1);
    }
  };

  // ✅ دالة لزر القلب (إضافة/إزالة من المفضلة)
  const handleToggleWishlist = () => {
    setIsInWishlist(!isInWishlist);
    // TODO: إضافة للقاعدة
  };

  // ✅ دالة لزر المشاركة
  const handleShare = async () => {
    const url = (typeof window !== 'undefined' ? window.location.href : '');
    const title = vendor?.name_ar || vendor?.name;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `شاهد ${title} على بوابتي`,
          url: url,
        });
      } catch (err) {
      }
    } else {
      // Fallback: نسخ الرابط
      if (url) {
        navigator.clipboard.writeText(url);
        alert('تم نسخ الرابط!');
      }
    }
  };

  // ✅ دالة لفتح الخريطة
  const handleOpenMap = () => {
    if (typeof window === 'undefined') return;
    if (vendor?.latitude && vendor?.longitude) {
      const url = `https://www.google.com/maps?q=${vendor.latitude},${vendor.longitude}`;
      window.open(url, '_blank');
    } else if (vendor?.store_address && typeof vendor.store_address === 'string') {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vendor.store_address)}`;
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-bold">جاري تحميل المتجر...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!vendor) return null;

  const themeGradient = isRestaurant 
    ? 'from-orange-600 via-red-600 to-pink-600' 
    : 'from-purple-600 via-indigo-600 to-blue-600';
  const accentColor = isRestaurant ? 'text-orange-600' : 'text-purple-600';
  const accentBg = isRestaurant ? 'bg-orange-600' : 'bg-purple-600';

  return (
    <main className="min-h-screen bg-gray-50/50">
      <Header />

      {/* Hero Section - Professional & Modern */}
      <div className="relative h-[350px] md:h-[450px] overflow-hidden">
        {vendor.shop_banner ? (
          <img 
            src={vendor.shop_banner} 
            alt={vendor.name_ar}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${themeGradient}`}></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 right-0 pb-10">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10">
              {/* Logo with Glow Effect */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group"
              >
                <div className={`absolute -inset-1 bg-gradient-to-r ${themeGradient} rounded-[35px] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200`}></div>
                <div className="relative w-32 h-32 md:w-44 md:h-44 bg-white rounded-[32px] p-3 shadow-2xl overflow-hidden">
                  {vendor.shop_logo ? (
                    <img 
                      src={vendor.shop_logo} 
                      alt={vendor.name_ar}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${themeGradient} rounded-2xl flex items-center justify-center`}>
                      {isRestaurant ? <ChefHat className="w-16 h-16 text-white" /> : <Package className="w-16 h-16 text-white" />}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Vendor Info */}
              <div className="flex-1 text-center md:text-right text-white">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight">{vendor.name_ar || vendor.name}</h1>
                    {vendor.is_featured && (
                      <span className="bg-yellow-400 text-yellow-950 px-4 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-lg">
                        <Star className="w-3 h-3 fill-current" /> مميز
                      </span>
                    )}
                    <span className={`px-4 py-1 rounded-full text-xs font-black shadow-lg ${vendor.is_online ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                      {vendor.is_online ? '🟢 متصل الآن' : '⚪ مغلق حالياً'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm md:text-base font-medium opacity-90">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="font-black">{vendor.rating?.toFixed(1) || '0.0'}</span>
                      <span className="text-white/60">({vendor.reviews_count || 0} تقييم)</span>
                    </div>

                    <button 
                      onClick={handleOpenMap}
                      className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl hover:bg-white/20 transition-all cursor-pointer"
                    >
                      <MapPin className="w-5 h-5 text-red-400" />
                      <span>{vendor.store_address || (isRestaurant ? 'موقع المطعم' : 'موقع المتجر')}</span>
                    </button>

                    {vendor.min_order_amount > 0 && (
                      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl">
                        <DollarSign className="w-5 h-5 text-green-400" />
                        <span>الحد الأدنى: {formatPrice(vendor.min_order_amount)}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3">
                <button 
                  onClick={handleToggleWishlist}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-md transition-all ${
                    isInWishlist ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${isInWishlist ? 'fill-current' : ''}`} />
                </button>
                <button 
                  onClick={handleShare}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/10 text-white backdrop-blur-md hover:bg-white/20 transition-all"
                >
                  <Share2 className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar - Info & Filters */}
          <aside className="lg:w-80 space-y-8">
            {/* Search in Vendor */}
            <div className="bg-white p-6 rounded-[32px] shadow-xl shadow-gray-200/50 border border-gray-100">
              <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                <Search className={`w-5 h-5 ${accentColor}`} />
                بحث في {isRestaurant ? 'القائمة' : 'المتجر'}
              </h3>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="ابحث عن منتج..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 pr-12 pl-4 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Vendor Details Card */}
            <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-gray-200/50 border border-gray-100">
              <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                <Info className={`w-5 h-5 ${accentColor}`} />
                معلومات التواصل
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${accentBg} bg-opacity-10 flex items-center justify-center flex-shrink-0`}>
                    <Phone className={`w-5 h-5 ${accentColor}`} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 mb-1">رقم الهاتف</p>
                    <p className="font-black text-gray-700">{vendor.store_phone || 'غير متوفر'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${accentBg} bg-opacity-10 flex items-center justify-center flex-shrink-0`}>
                    <MapPin className={`w-5 h-5 ${accentColor}`} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 mb-1">العنوان</p>
                    <p className="font-black text-gray-700">{vendor.store_address || 'غير متوفر'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${accentBg} bg-opacity-10 flex items-center justify-center flex-shrink-0`}>
                    <Clock className={`w-5 h-5 ${accentColor}`} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 mb-1">ساعات العمل</p>
                    <p className="font-black text-gray-700">9:00 ص - 11:00 م</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Tabs */}
            <div className="flex gap-4 mb-10 bg-white p-2 rounded-3xl shadow-sm border border-gray-100 w-fit">
              <button 
                onClick={() => setActiveTab('products')}
                className={`px-8 py-3 rounded-2xl font-black transition-all ${
                  activeTab === 'products' 
                    ? `${accentBg} text-white shadow-lg` 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {isRestaurant ? 'قائمة الطعام' : 'المنتجات'}
              </button>
              <button 
                onClick={() => setActiveTab('about')}
                className={`px-8 py-3 rounded-2xl font-black transition-all ${
                  activeTab === 'about' 
                    ? `${accentBg} text-white shadow-lg` 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                عن {isRestaurant ? 'المطعم' : 'المتجر'}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'products' ? (
                <motion.div 
                  key="products"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                >
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <Link 
                        key={product.id} 
                        href={isRestaurant ? `/meals/${product.id}` : `/products/${product.id}`}
                      >
                        <div className="group bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                          <div className="relative aspect-square overflow-hidden">
                            <img 
                              src={product.images?.[0] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'} 
                              alt={product.name_ar}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                handleAddToCart(product.id);
                              }}
                              className={`absolute bottom-4 left-4 right-4 py-3 rounded-2xl text-white font-black flex items-center justify-center gap-2 translate-y-10 group-hover:translate-y-0 transition-all duration-500 ${accentBg}`}
                            >
                              <ShoppingCart className="w-5 h-5" />
                              إضافة للسلة
                            </button>
                          </div>
                          <div className="p-6">
                            <h3 className="font-black text-gray-800 text-lg mb-2 line-clamp-1 group-hover:text-purple-600 transition-colors">
                              {product.name_ar || product.name}
                            </h3>
                            <div className="flex items-center justify-between">
                              <span className={`text-2xl font-black ${accentColor}`}>
                                {formatPrice(product.price)}
                              </span>
                              {product.sale_price && (
                                <span className="text-sm text-gray-400 line-through">
                                  {formatPrice(product.sale_price)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center">
                      <div className={`w-20 h-20 ${accentBg} bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-6`}>
                        <Search className={`w-10 h-10 ${accentColor}`} />
                      </div>
                      <h3 className="text-2xl font-black text-gray-800 mb-2">لا توجد نتائج</h3>
                      <p className="text-gray-500">لم نجد أي منتجات تطابق بحثك في هذا المتجر</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="about"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white p-10 md:p-16 rounded-[40px] shadow-xl border border-gray-50"
                >
                  <div className="max-w-3xl">
                    <h2 className="text-3xl font-black mb-8 flex items-center gap-3">
                      <Info className={`w-8 h-8 ${accentColor}`} />
                      قصتنا وتفاصيلنا
                    </h2>
                    <p className="text-xl text-gray-600 leading-relaxed mb-10 whitespace-pre-line">
                      {vendor.shop_description_ar || vendor.shop_description || 'لا يوجد وصف متاح حالياً لهذا المتجر.'}
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="font-black text-gray-900">المميزات</h4>
                        <ul className="space-y-3">
                          {['توصيل سريع', 'منتجات أصلية', 'دفع عند الاستلام', 'دعم فني 24/7'].map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-gray-600">
                              <div className={`w-2 h-2 rounded-full ${accentBg}`}></div>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-black text-gray-900">طرق الدفع</h4>
                        <div className="flex flex-wrap gap-3">
                          {['نقداً', 'بطاقة ائتمان', 'محفظة إلكترونية'].map((item, i) => (
                            <span key={i} className="bg-gray-100 px-4 py-2 rounded-xl text-sm font-bold text-gray-600">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
