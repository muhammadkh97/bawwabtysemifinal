'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingCart, Heart, Truck, ShieldCheck, RotateCcw, Loader2, MessageCircle, Store } from 'lucide-react';
import ChatComponent from '@/components/ChatComponent';
import ReviewForm from '@/components/ReviewForm';
import ReviewsList from '@/components/ReviewsList';
import ShareButtons from '@/components/ShareButtons';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import EmptyState from '@/components/EmptyState';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  old_price?: number;
  original_currency?: string;
  images: string[];
  category: string;
  stock: number;
  rating: number;
  reviews_count: number;
  vendor_id: string;
  vendor?: {
    store_name: string;
    user_id: string;
  };
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { formatPrice, convertPrice } = useCurrency();

  // الحد الأدنى للمسافة المطلوبة لاعتبارها swipe
  const minSwipeDistance = 50;

  useEffect(() => {
    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // التعامل مع مفاتيح الأسهم
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!product?.images || product.images.length <= 1) return;
      
      if (e.key === 'ArrowRight') {
        setSelectedImage((prev) => 
          prev === 0 ? (product.images?.length || 1) - 1 : prev - 1
        );
      } else if (e.key === 'ArrowLeft') {
        setSelectedImage((prev) => 
          prev === (product.images?.length || 1) - 1 ? 0 : prev + 1
        );
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [product]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || !product?.images) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      // التمرير لليسار = الصورة التالية
      setSelectedImage((prev) => 
        prev === (product.images?.length || 1) - 1 ? 0 : prev + 1
      );
    } else if (isRightSwipe) {
      // التمرير لليمين = الصورة السابقة
      setSelectedImage((prev) => 
        prev === 0 ? (product.images?.length || 1) - 1 : prev - 1
      );
    }
  };

  const nextImage = () => {
    if (!product?.images) return;
    setSelectedImage((prev) => 
      prev === (product.images?.length || 1) - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    if (!product?.images) return;
    setSelectedImage((prev) => 
      prev === 0 ? (product.images?.length || 1) - 1 : prev - 1
    );
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          vendor:vendors(store_name, user_id)
        `)
        .eq('id', productId)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (product) {
      await addToCart(product.id, quantity);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    
    if (isInWishlist(product.id)) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product.id);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-lg">جاري تحميل المنتج...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <EmptyState
            type="products"
            title="المنتج غير موجود"
            description="عذراً، لم نتمكن من العثور على المنتج المطلوب"
            actionLabel="العودة للمنتجات"
            actionHref="/products"
          />
        </div>
        <Footer />
      </main>
    );
  }

  const images = product.images && product.images.length > 0 
    ? product.images 
    : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'];
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-6">
          <Link href="/" className="text-primary-600 hover:underline">
            الرئيسية
          </Link>
          <span className="text-gray-400">/</span>
          <Link href="/products" className="text-primary-600 hover:underline">
            المنتجات
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Images */}
          <div>
            {/* Main Image with Premium Design */}
            <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-4 mb-6 shadow-2xl">
              <div 
                className="relative aspect-square rounded-2xl overflow-hidden bg-white touch-pan-y"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <Image
                  src={images[selectedImage]}
                  alt={product.name}
                  fill
                  className="object-contain p-4"
                  priority
                />
                
                {/* أسهم التنقل - تظهر فقط على الشاشات الكبيرة وعند وجود أكثر من صورة */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-lg transition-all hover:scale-110 z-10 backdrop-blur-sm"
                      aria-label="الصورة السابقة"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={nextImage}
                      className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-lg transition-all hover:scale-110 z-10 backdrop-blur-sm"
                      aria-label="الصورة التالية"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Wishlist Button */}
                <button
                  onClick={handleToggleWishlist}
                  className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-md shadow-lg transition-all z-10 ${
                    isInWishlist(product.id)
                      ? 'bg-red-500 text-white'
                      : 'bg-white/80 text-red-500 hover:bg-red-50'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${isInWishlist(product.id) ? 'fill-white' : ''}`} />
                </button>
                
                {/* Discount Badge */}
                {product.old_price && (
                  <div className="absolute top-4 left-4 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full font-bold shadow-lg z-10">
                    {Math.round(((product.old_price - product.price) / product.old_price) * 100)}% خصم
                  </div>
                )}
                
                {/* مؤشر الصور - يظهر عند وجود أكثر من صورة */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          selectedImage === idx 
                            ? 'bg-purple-600 w-6' 
                            : 'bg-white/50 hover:bg-white/80'
                        }`}
                        aria-label={`الصورة ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Thumbnails with Premium Style */}
            <div className="grid grid-cols-4 gap-3">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
                    selectedImage === idx 
                      ? 'ring-4 ring-purple-500 shadow-lg shadow-purple-500/50 scale-105' 
                      : 'ring-2 ring-gray-200 hover:ring-purple-300 hover:shadow-md'
                  }`}
                  onClick={() => setSelectedImage(idx)}
                >
                  <Image 
                    src={img} 
                    alt={`${product.name} ${idx + 1}`} 
                    fill 
                    className="object-contain p-2 bg-white"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-2xl p-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-primary-600 font-medium">{product.vendor?.store_name || 'متجر'}</span>
              <span className="text-sm text-gray-400">•</span>
              <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {product.stock > 0 ? 'متوفر في المخزون' : 'نفذت الكمية'}
              </span>
            </div>

            {/* Vendor Action Buttons */}
            {product.vendor && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => router.push(`/chats?vendor=${product.vendor_id}`)}
                  className="group relative overflow-hidden rounded-2xl px-4 py-3.5 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 opacity-90 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/50 via-pink-600/50 to-blue-600/50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center justify-center gap-2 text-white">
                    <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm">تواصل مع البائع</span>
                  </div>
                </button>
                
                <Link
                  href={`/vendors/${product.vendor_id}`}
                  className="group relative overflow-hidden rounded-2xl px-4 py-3.5 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/30 block"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-90 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/50 via-purple-600/50 to-pink-600/50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center justify-center gap-2 text-white">
                    <Store className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm">زيارة المتجر</span>
                  </div>
                </Link>
              </div>
            )}

            <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= Math.floor(product.rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-lg font-medium">{product.rating.toFixed(1)}</span>
              <span className="text-gray-400">({product.reviews_count} تقييم)</span>
            </div>

            <div className="flex items-baseline gap-4 mb-6">
              <span className="text-5xl font-bold text-primary-600">
                {formatPrice(product.price, product.original_currency || 'SAR')}
              </span>
              {product.old_price && (
                <>
                  <span className="text-2xl text-gray-400 line-through">
                    {formatPrice(product.old_price, product.original_currency || 'SAR')}
                  </span>
                  <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-bold">
                    وفر {formatPrice(product.old_price - product.price, product.original_currency || 'SAR')}
                  </span>
                </>
              )}
            </div>

            <p className="text-gray-600 text-lg mb-6">{product.description}</p>

            {/* Quantity */}
            <div className="mb-6">
              <label className="block font-bold mb-2">الكمية:</label>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 font-bold"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                  min="1"
                  max={product.stock}
                  className="w-20 h-10 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button 
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 font-bold"
                >
                  +
                </button>
                <span className="text-sm text-gray-500">متوفر {product.stock} قطعة</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 mb-8">
              {/* Add to Cart and Wishlist */}
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="col-span-2 group relative overflow-hidden rounded-2xl px-6 py-4 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 opacity-90 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600/50 via-emerald-600/50 to-teal-600/50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center justify-center gap-2 text-white">
                    <ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-lg">أضف للسلة</span>
                  </div>
                </button>
                
                <button 
                  onClick={handleToggleWishlist}
                  className="group relative overflow-hidden rounded-2xl px-6 py-4 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/30"
                >
                  <div className={`absolute inset-0 transition-opacity ${
                    isInWishlist(product.id)
                      ? 'bg-gradient-to-r from-red-600 via-pink-600 to-rose-600 opacity-90'
                      : 'bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 opacity-90'
                  } group-hover:opacity-100`} />
                  <div className={`absolute inset-0 blur-xl opacity-0 group-hover:opacity-100 transition-opacity ${
                    isInWishlist(product.id)
                      ? 'bg-gradient-to-r from-red-600/50 via-pink-600/50 to-rose-600/50'
                      : 'bg-gradient-to-r from-gray-600/50 via-gray-700/50 to-gray-800/50'
                  }`} />
                  <div className="relative flex items-center justify-center">
                    <Heart className={`w-6 h-6 transition-all group-hover:scale-110 ${
                      isInWishlist(product.id) 
                        ? 'text-white fill-white' 
                        : 'text-white'
                    }`} />
                  </div>
                </button>
              </div>

              {/* Share Button */}
              <ShareButtons 
                productName={product.name}
                productId={product.id}
                productPrice={product.price}
                productImage={product.images[0]}
              />
            </div>


            {/* Additional Info */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="text-center">
                <Truck className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                <p className="text-sm font-medium">شحن مجاني</p>
                <p className="text-xs text-gray-500">للطلبات فوق 200 د.أ</p>
              </div>
              <div className="text-center">
                <ShieldCheck className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                <p className="text-sm font-medium">ضمان سنة</p>
                <p className="text-xs text-gray-500">ضمان الشركة</p>
              </div>
              <div className="text-center">
                <RotateCcw className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                <p className="text-sm font-medium">إرجاع مجاني</p>
                <p className="text-xs text-gray-500">خلال 14 يوم</p>
              </div>
            </div>
          </div>
        </div>

        {/* التقييمات والمراجعات */}
        <div className="mt-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              ⭐ التقييمات والمراجعات
            </h2>
            <p className="text-gray-600 text-lg">
              شارك تجربتك مع المنتج واقرأ آراء العملاء الآخرين
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="h-1 w-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"></div>
              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              <div className="h-1 w-20 bg-gradient-to-r from-pink-600 to-blue-600 rounded-full"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* نموذج التقييم */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <ReviewForm 
                  productId={product.id} 
                  onSuccess={() => {
                    fetchProduct();
                  }}
                />
              </div>
            </div>
            
            {/* قائمة التقييمات */}
            <div className="lg:col-span-2">
              <ReviewsList productId={product.id} />
            </div>
          </div>
        </div>
      </div>

      {/* مكون الدردشة */}
      {product.vendor && (
        <ChatComponent 
          vendorId={product.vendor_id}
          vendorName={product.vendor.store_name}
          vendorAvatar=""
        />
      )}

      <Footer />
    </main>
  );
}
