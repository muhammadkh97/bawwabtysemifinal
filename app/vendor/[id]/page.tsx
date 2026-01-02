'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { 
  MapPin, Star, Clock, Phone, ChefHat, Package, 
  ArrowRight, ShoppingCart, Heart, Share2 
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'about'>('products');

  useEffect(() => {
    if (vendorId) {
      fetchVendorDetails();
      fetchVendorProducts();
    }
  }, [vendorId]);

  const fetchVendorDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .eq('approval_status', 'approved')
        .single();

      if (error) throw error;
      setVendor(data);
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

  if (loading) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">جاري التحميل...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!vendor) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              المتجر غير موجود
            </h1>
            <Link 
              href="/vendors"
              className="text-purple-600 hover:underline"
            >
              العودة للقائمة
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  const isRestaurant = vendor.vendor_type === 'restaurant';
  const themeColor = isRestaurant ? 'from-orange-600 to-red-600' : 'from-purple-600 to-pink-600';
  const iconColor = isRestaurant ? 'text-orange-600' : 'text-purple-600';

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* Banner Section */}
      <div className="relative h-80 overflow-hidden">
        {vendor.shop_banner ? (
          <img 
            src={vendor.shop_banner} 
            alt={vendor.shop_name_ar}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-r ${themeColor}`}></div>
        )}
        <div className="absolute inset-0 bg-black/40"></div>
        
        {/* Vendor Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto flex items-end gap-6">
            {/* Logo */}
            <div className="w-32 h-32 bg-white rounded-3xl p-3 shadow-2xl">
              {vendor.shop_logo ? (
                <img 
                  src={vendor.shop_logo} 
                  alt={vendor.shop_name_ar}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${themeColor} rounded-2xl flex items-center justify-center`}>
                  {isRestaurant ? (
                    <ChefHat className="w-16 h-16 text-white" />
                  ) : (
                    <Package className="w-16 h-16 text-white" />
                  )}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 text-white">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-black">{vendor.shop_name_ar || vendor.shop_name}</h1>
                {vendor.is_featured && (
                  <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
                    ⭐ مميز
                  </span>
                )}
                {vendor.is_online && (
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    🟢 متصل الآن
                  </span>
                )}
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="font-bold">{vendor.rating?.toFixed(1) || '0.0'}</span>
                  <span className="text-gray-300">({vendor.reviews_count || 0} تقييم)</span>
                </div>

                {vendor.latitude && vendor.longitude && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    <span>{vendor.store_address || 'موقع متاح'}</span>
                  </div>
                )}

                {vendor.min_order_amount > 0 && (
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    <span>الحد الأدنى: {vendor.min_order_amount} ₪</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>التوصيل: 30-45 دقيقة</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center hover:bg-white/30 transition">
                <Heart className="w-6 h-6 text-white" />
              </button>
              <button className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center hover:bg-white/30 transition">
                <Share2 className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 font-bold transition relative ${
              activeTab === 'products'
                ? `${iconColor} border-b-2 ${isRestaurant ? 'border-orange-600' : 'border-purple-600'}`
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {isRestaurant ? '🍽️ قائمة الطعام' : '📦 المنتجات'}
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`px-6 py-3 font-bold transition relative ${
              activeTab === 'about'
                ? `${iconColor} border-b-2 ${isRestaurant ? 'border-orange-600' : 'border-purple-600'}`
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            ℹ️ عن {isRestaurant ? 'المطعم' : 'المتجر'}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'products' ? (
          <div>
            {products.length === 0 ? (
              <div className="text-center py-20">
                <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${themeColor} flex items-center justify-center mx-auto mb-4 opacity-50`}>
                  {isRestaurant ? (
                    <ChefHat className="w-12 h-12 text-white" />
                  ) : (
                    <Package className="w-12 h-12 text-white" />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  لا توجد {isRestaurant ? 'وجبات' : 'منتجات'} حالياً
                </h3>
                <p className="text-gray-600">
                  {isRestaurant ? 'المطعم' : 'المتجر'} لم يضف أي {isRestaurant ? 'وجبات' : 'منتجات'} بعد
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/products/${product.id}`}>
                      <div className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group">
                        {/* Product Image */}
                        <div className="relative h-48 overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.name_ar || product.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className={`w-full h-full bg-gradient-to-br ${themeColor} flex items-center justify-center`}>
                              <Package className="w-20 h-20 text-white opacity-50" />
                            </div>
                          )}

                          {product.sale_price && product.sale_price < product.price && (
                            <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                              خصم {Math.round((1 - product.sale_price / product.price) * 100)}%
                            </div>
                          )}

                          {product.stock === 0 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="text-white font-bold text-lg">نفذ من المخزون</span>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="p-4">
                          <h3 className={`text-lg font-bold text-gray-900 mb-2 group-hover:${iconColor} transition-colors line-clamp-2`}>
                            {product.name_ar || product.name}
                          </h3>

                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {product.description_ar || product.description}
                          </p>

                          <div className="flex items-center justify-between">
                            <div>
                              {product.sale_price && product.sale_price < product.price ? (
                                <div>
                                  <span className={`text-2xl font-bold ${iconColor}`}>
                                    {product.sale_price} ₪
                                  </span>
                                  <span className="text-sm text-gray-400 line-through mr-2">
                                    {product.price} ₪
                                  </span>
                                </div>
                              ) : (
                                <span className={`text-2xl font-bold ${iconColor}`}>
                                  {product.price} ₪
                                </span>
                              )}
                            </div>

                            <button 
                              className={`w-10 h-10 rounded-xl bg-gradient-to-r ${themeColor} flex items-center justify-center text-white hover:shadow-lg transition`}
                              disabled={product.stock === 0}
                            >
                              <ShoppingCart className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-4">
              عن {isRestaurant ? 'المطعم' : 'المتجر'}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              {vendor.shop_description_ar || vendor.shop_description || 'لا يوجد وصف متاح'}
            </p>

            {vendor.store_phone && (
              <div className="flex items-center gap-3 mb-4">
                <Phone className={`w-5 h-5 ${iconColor}`} />
                <span className="font-bold">الهاتف:</span>
                <a href={`tel:${vendor.store_phone}`} className={`${iconColor} hover:underline`}>
                  {vendor.store_phone}
                </a>
              </div>
            )}

            {vendor.store_address && (
              <div className="flex items-center gap-3">
                <MapPin className={`w-5 h-5 ${iconColor}`} />
                <span className="font-bold">العنوان:</span>
                <span className="text-gray-600">{vendor.store_address}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
