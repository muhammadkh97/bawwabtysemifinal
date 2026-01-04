'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
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
  shop_name: string;
  shop_name_ar: string;
  shop_logo: string;
  shop_banner: string;
  shop_description: string;
  shop_description_ar: string;
  vendor_type: 'shop' | 'restaurant';
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

  useEffect(() => {
    if (vendorId) {
      fetchVendorDetails();
      fetchVendorProducts();
    }
  }, [vendorId]);

  const fetchVendorDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', vendorId)
        .eq('approval_status', 'approved')
        .single();

      if (error) throw error;
      setVendor(data);
      setIsRestaurant(data?.vendor_type === 'restaurant');
    } catch (error) {
      console.error('Error fetching vendor:', error);
      router.push('/404');
    } finally {
      setLoading(false);
    }
  };

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
      console.error('Error fetching products:', error);
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
            alt={vendor.shop_name_ar}
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
                      alt={vendor.shop_name_ar}
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
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight">{vendor.shop_name_ar || vendor.shop_name}</h1>
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

                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl">
                      <MapPin className="w-5 h-5 text-red-400" />
                      <span>{vendor.store_address || 'موقع المتجر'}</span>
                    </div>

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
                <button className="w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all group">
                  <Heart className="w-6 h-6 text-white group-hover:fill-red-500 group-hover:text-red-500 transition-colors" />
                </button>
                <button className="w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all">
                  <Share2 className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar - Info & Search */}
          <aside className="w-full lg:w-80 space-y-8">
            {/* Search in Store */}
            <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
              <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                <Search className={`w-5 h-5 ${accentColor}`} />
                بحث في {isRestaurant ? 'القائمة' : 'المتجر'}
              </h3>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="ابحث عن وجبة أو منتج..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 pr-12 pl-4 text-sm font-bold focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Store Info Card */}
            <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
              <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                <Info className={`w-5 h-5 ${accentColor}`} />
                معلومات التواصل
              </h3>
              <div className="space-y-6">
                {vendor.store_phone && (
                  <div className="flex items-center gap-4 group cursor-pointer">
                    <div className={`w-12 h-12 rounded-2xl ${accentBg}/10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Phone className={`w-5 h-5 ${accentColor}`} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase">رقم الهاتف</p>
                      <p className="text-sm font-black text-gray-900">{vendor.store_phone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4 group cursor-pointer">
                  <div className={`w-12 h-12 rounded-2xl ${accentBg}/10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Clock className={`w-5 h-5 ${accentColor}`} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">وقت التوصيل</p>
                    <p className="text-sm font-black text-gray-900">30 - 45 دقيقة</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group cursor-pointer">
                  <div className={`w-12 h-12 rounded-2xl ${accentBg}/10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Utensils className={`w-5 h-5 ${accentColor}`} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">نوع الخدمة</p>
                    <p className="text-sm font-black text-gray-900">{isRestaurant ? 'مطعم / وجبات سريعة' : 'متجر / منتجات عامة'}</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid - 2 Columns on Mobile, 3-4 on Desktop */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-black text-gray-900">
                {isRestaurant ? '🍽️ قائمة الطعام' : '📦 المنتجات المتاحة'}
                <span className="mr-3 text-sm font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                  {filteredProducts.length}
                </span>
              </h2>
              <div className="flex items-center gap-2">
                <button className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
                  <Filter className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-[40px] p-20 text-center shadow-xl shadow-gray-200/50 border border-gray-100">
                <div className={`w-24 h-24 rounded-full ${accentBg}/10 flex items-center justify-center mx-auto mb-6`}>
                  <Search className={`w-12 h-12 ${accentColor} opacity-20`} />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">لا توجد نتائج!</h3>
                <p className="text-gray-500 font-medium">لم نجد أي {isRestaurant ? 'وجبات' : 'منتجات'} تطابق بحثك حالياً.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-8">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group"
                  >
                    <div className="bg-white rounded-[32px] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col h-full">
                      {/* Product Image Container */}
                      <div className="relative aspect-square overflow-hidden">
                        <Link href={isRestaurant ? `/meals/${product.id}` : `/products/${product.id}`}>
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.name_ar || product.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                          ) : (
                            <div className={`w-full h-full bg-gradient-to-br ${themeGradient} opacity-20 flex items-center justify-center`}>
                              <Package className={`w-16 h-16 ${accentColor}`} />
                            </div>
                          )}
                        </Link>
                        
                        {/* Badges */}
                        <div className="absolute top-3 right-3 flex flex-col gap-2">
                          {product.sale_price && product.sale_price < product.price && (
                            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-black shadow-lg">
                              خصم {Math.round((1 - product.sale_price / product.price) * 100)}%
                            </div>
                          )}
                        </div>

                        {/* Quick Add Button - Floating */}
                        <button 
                          onClick={() => handleAddToCart(product.id)}
                          disabled={product.stock === 0}
                          className={`absolute bottom-4 left-4 w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white shadow-xl flex items-center justify-center text-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300 transform translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 disabled:opacity-50`}
                        >
                          <ShoppingCart className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Product Info */}
                      <div className="p-4 md:p-6 flex flex-col flex-1">
                        <Link href={isRestaurant ? `/meals/${product.id}` : `/products/${product.id}`}>
                          <h3 className="text-sm md:text-lg font-black text-gray-900 mb-2 group-hover:text-purple-600 transition-colors line-clamp-1">
                            {product.name_ar || product.name}
                          </h3>
                        </Link>
                        <p className="text-[10px] md:text-xs text-gray-500 font-bold mb-4 line-clamp-2 leading-relaxed">
                          {product.description_ar || product.description || 'لا يوجد وصف متاح لهذه الوجبة حالياً.'}
                        </p>
                        
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex flex-col">
                            {product.sale_price && product.sale_price < product.price ? (
                              <>
                                <span className={`text-lg md:text-2xl font-black ${accentColor}`}>
                                  {formatPrice(product.sale_price)}
                                </span>
                                <span className="text-[10px] md:text-xs text-gray-400 line-through font-bold">
                                  {formatPrice(product.price)}
                                </span>
                              </>
                            ) : (
                              <span className={`text-lg md:text-2xl font-black ${accentColor}`}>
                                {formatPrice(product.price)}
                              </span>
                            )}
                          </div>
                          
                          {/* Mobile Add Button */}
                          <button 
                            onClick={() => handleAddToCart(product.id)}
                            disabled={product.stock === 0}
                            className={`md:hidden w-10 h-10 rounded-xl ${accentBg} flex items-center justify-center text-white shadow-lg`}
                          >
                            <ShoppingCart className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* About Section - Detailed */}
      <section className="bg-white py-20 border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className={`w-20 h-20 rounded-[28px] ${accentBg}/10 flex items-center justify-center mx-auto mb-8`}>
              <Info className={`w-10 h-10 ${accentColor}`} />
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-6">
              عن {isRestaurant ? 'المطعم' : 'المتجر'}
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed font-medium mb-10">
              {vendor.shop_description_ar || vendor.shop_description || 'نحن نسعى دائماً لتقديم أفضل تجربة لعملائنا من خلال جودة المنتجات وسرعة التوصيل.'}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-[32px] bg-gray-50 border border-gray-100">
                <Star className="w-8 h-8 text-yellow-500 mx-auto mb-4" />
                <h4 className="text-xl font-black text-gray-900 mb-2">تقييمات عالية</h4>
                <p className="text-sm text-gray-500 font-bold">نفتخر بثقة عملائنا بنا دائماً</p>
              </div>
              <div className="p-8 rounded-[32px] bg-gray-50 border border-gray-100">
                <Clock className="w-8 h-8 text-blue-500 mx-auto mb-4" />
                <h4 className="text-xl font-black text-gray-900 mb-2">توصيل سريع</h4>
                <p className="text-sm text-gray-500 font-bold">نصل إليك في أسرع وقت ممكن</p>
              </div>
              <div className="p-8 rounded-[32px] bg-gray-50 border border-gray-100">
                <ChefHat className="w-8 h-8 text-orange-500 mx-auto mb-4" />
                <h4 className="text-xl font-black text-gray-900 mb-2">جودة مضمونة</h4>
                <p className="text-sm text-gray-500 font-bold">أفضل المكونات والمنتجات المختارة</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
