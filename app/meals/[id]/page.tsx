'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  UtensilsCrossed, Star, Clock, ChevronLeft, Heart, 
  Plus, Minus, AlertCircle, Check
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useRestaurantCart } from '@/contexts/RestaurantCartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { toast } from 'react-hot-toast';

interface Meal {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  price: number;
  old_price: number | null;
  images: string[];
  vendor_id: string;
  has_variants: boolean;
  variants: MealVariant[] | null;
  preparation_time: number;
  is_available: boolean;
  vendors: {
    shop_name: string;
    shop_name_ar: string;
    shop_logo: string;
    rating: number;
  };
}

interface MealVariant {
  id: string;
  name: string;
  name_ar: string;
  type: 'size' | 'addon' | 'option';
  required: boolean;
  options: VariantOption[];
}

interface VariantOption {
  id: string;
  name: string;
  name_ar: string;
  price_modifier: number;
}

export default function MealDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const mealId = params.id as string;
  const { formatPrice, convertPrice } = useCurrency();
  const { addToRestaurantCart } = useRestaurantCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [meal, setMeal] = useState<Meal | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState({ fee: 5, time: '30-60', distance: 0 });
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (mealId) {
      fetchMealDetails();
      getUserLocation();
    }
  }, [mealId]);

  // الحصول على موقع المستخدم
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Could not get location:', error);
        }
      );
    }
  };

  // حساب المسافة بين نقطتين (بالكيلومتر)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // حساب رسوم ووقت التوصيل بناءً على المسافة
  const calculateDeliveryInfo = (restaurantLat: number, restaurantLng: number) => {
    if (!userLocation) {
      return { fee: 5, time: '30-60', distance: 0 };
    }

    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      restaurantLat,
      restaurantLng
    );

    // حساب الرسوم: 3 دينار للكيلومتر الأول + 1 دينار لكل كيلومتر إضافي
    let fee = 3;
    if (distance > 1) {
      fee += Math.ceil(distance - 1) * 1;
    }
    // الحد الأقصى 15 دينار
    fee = Math.min(fee, 15);

    // حساب الوقت: 20 دقيقة + 5 دقائق لكل كيلومتر
    const minTime = Math.ceil(20 + (distance * 5));
    const maxTime = Math.ceil(minTime + 15);
    const timeRange = `${minTime}-${maxTime}`;

    return { fee, time: timeRange, distance: Math.round(distance * 10) / 10 };
  };

  const fetchMealDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          vendors!products_vendor_id_vendors_fkey(
            shop_name,
            shop_name_ar,
            shop_logo,
            rating
          )
        `)
        .eq('id', mealId)
        .eq('status', 'approved')
        .single();

      if (error) throw error;
      
      // التحقق من أن المنتج من مطعم
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('vendor_type')
        .eq('id', data.vendor_id)
        .single();

      if (vendorData?.vendor_type !== 'restaurant') {
        // إعادة التوجيه لصفحة المنتج العادية
        router.push(`/products/${mealId}`);
        return;
      }

      setMeal(data);

      // حساب معلومات التوصيل إذا كان هناك موقع للمطعم
      const { data: restaurantData } = await supabase
        .from('stores')
        .select('latitude, longitude, lat, lng')
        .eq('id', data.vendor_id)
        .single();

      if (restaurantData) {
        const lat = restaurantData.latitude || restaurantData.lat;
        const lng = restaurantData.longitude || restaurantData.lng;
        if (lat && lng) {
          const deliveryCalc = calculateDeliveryInfo(lat, lng);
          setDeliveryInfo(deliveryCalc);
        }
      }
    } catch (error) {
      console.error('Error fetching meal:', error);
      toast.error('حدث خطأ في تحميل تفاصيل الوجبة');
      router.push('/restaurants');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!meal) return;

    // التحقق من المتغيرات المطلوبة
    if (meal.has_variants && meal.variants) {
      const requiredVariants = meal.variants.filter(v => v.required);
      const missingVariants = requiredVariants.filter(v => !selectedVariants[v.id]);
      
      if (missingVariants.length > 0) {
        toast.error('يرجى اختيار جميع الخيارات المطلوبة');
        return;
      }
    }

    try {
      setAdding(true);
      
      // إضافة الوجبة للسلة مع الملاحظات
      await addToRestaurantCart(meal.id, meal.vendor_id, quantity, specialInstructions);
      
      toast.success('تمت إضافة الوجبة لسلة الطلبات');
      
      // إعادة تعيين النموذج
      setQuantity(1);
      setSpecialInstructions('');
      setSelectedVariants({});
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('حدث خطأ في إضافة الوجبة');
    } finally {
      setAdding(false);
    }
  };

  const calculateTotalPrice = () => {
    if (!meal) return 0;
    
    let total = meal.price;
    
    // إضافة أسعار المتغيرات المختارة
    if (meal.variants && selectedVariants) {
      meal.variants.forEach(variant => {
        const selectedOptionId = selectedVariants[variant.id];
        if (selectedOptionId) {
          const option = variant.options.find(o => o.id === selectedOptionId);
          if (option) {
            total += option.price_modifier;
          }
        }
      });
    }
    
    return total * quantity;
  };

  const handleToggleWishlist = async () => {
    if (!meal) return;
    
    if (isInWishlist(meal.id)) {
      await removeFromWishlist(meal.id);
      toast.success('تمت الإزالة من المفضلة');
    } else {
      await addToWishlist(meal.id);
      toast.success('تمت الإضافة للمفضلة');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-bold">جاري تحميل تفاصيل الوجبة...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!meal) return null;

  const discount = meal.old_price 
    ? Math.round(((meal.old_price - meal.price) / meal.old_price) * 100)
    : 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <Header />

      <div className="container mx-auto px-4 pt-32 pb-20">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-8">
          <Link href="/" className="text-gray-500 hover:text-orange-600">الرئيسية</Link>
          <ChevronLeft className="w-4 h-4 text-gray-400" />
          <Link href="/restaurants" className="text-gray-500 hover:text-orange-600">المطاعم</Link>
          <ChevronLeft className="w-4 h-4 text-gray-400" />
          <Link href={`/vendor/${meal.vendor_id}`} className="text-gray-500 hover:text-orange-600">
            {meal.vendors?.shop_name_ar || meal.vendors?.shop_name}
          </Link>
          <ChevronLeft className="w-4 h-4 text-gray-400" />
          <span className="text-orange-600 font-bold">{meal.name_ar || meal.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-white shadow-2xl">
              <img 
                src={meal.images?.[selectedImage] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=800&fit=crop'} 
                alt={meal.name_ar || meal.name}
                className="w-full h-full object-cover"
              />
              
              {/* Badges */}
              <div className="absolute top-6 right-6 flex flex-col gap-3">
                {discount > 0 && (
                  <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full font-black text-sm shadow-lg">
                    خصم {discount}%
                  </div>
                )}
                {!meal.is_available && (
                  <div className="bg-gray-900 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                    غير متوفر حالياً
                  </div>
                )}
              </div>

              {/* Wishlist Button */}
              <button
                onClick={handleToggleWishlist}
                className="absolute top-6 left-6 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              >
                <Heart 
                  className={`w-6 h-6 ${isInWishlist(meal.id) ? 'fill-red-500 text-red-500' : 'text-gray-700'}`}
                />
              </button>
            </div>

            {/* Thumbnails */}
            {meal.images && meal.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {meal.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-2xl overflow-hidden border-4 transition-all ${
                      selectedImage === index 
                        ? 'border-orange-500 shadow-lg' 
                        : 'border-transparent hover:border-orange-300'
                    }`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Meal Details */}
          <div className="space-y-6">
            {/* Restaurant Info */}
            <Link 
              href={`/vendor/${meal.vendor_id}`}
              className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all group"
            >
              <img 
                src={meal.vendors?.shop_logo || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200&h=200&fit=crop'} 
                alt="" 
                className="w-16 h-16 rounded-xl object-cover"
              />
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                  {meal.vendors?.shop_name_ar || meal.vendors?.shop_name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span>{meal.vendors?.rating?.toFixed(1) || '0.0'}</span>
                </div>
              </div>
            </Link>

            {/* Meal Name */}
            <div>
              <h1 className="text-4xl font-black text-gray-900 mb-2">
                {meal.name_ar || meal.name}
              </h1>
              <p className="text-gray-600 leading-relaxed">
                {meal.description_ar || meal.description}
              </p>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                {formatPrice(calculateTotalPrice())}
              </span>
              {meal.old_price && (
                <span className="text-xl text-gray-400 line-through">
                  {formatPrice(meal.old_price * quantity)}
                </span>
              )}
            </div>

            {/* Preparation Time */}
            {meal.preparation_time && (
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-5 h-5 text-orange-600" />
                <span>وقت التحضير: {meal.preparation_time} دقيقة</span>
              </div>
            )}

            {/* Variants */}
            {meal.has_variants && meal.variants && meal.variants.length > 0 && (
              <div className="space-y-6 p-6 bg-white rounded-2xl shadow-md">
                <h3 className="text-xl font-black text-gray-900">خصص طلبك</h3>
                
                {meal.variants.map((variant) => (
                  <div key={variant.id} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900">
                        {variant.name_ar || variant.name}
                      </h4>
                      {variant.required && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">
                          مطلوب
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {variant.options.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setSelectedVariants(prev => ({
                            ...prev,
                            [variant.id]: option.id
                          }))}
                          className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                            selectedVariants[variant.id] === option.id
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-orange-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              selectedVariants[variant.id] === option.id
                                ? 'border-orange-500 bg-orange-500'
                                : 'border-gray-300'
                            }`}>
                              {selectedVariants[variant.id] === option.id && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <span className="font-bold text-gray-900">
                              {option.name_ar || option.name}
                            </span>
                          </div>
                          {option.price_modifier !== 0 && (
                            <span className="text-orange-600 font-bold">
                              {option.price_modifier > 0 ? '+' : ''}{formatPrice(option.price_modifier)}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Special Instructions */}
            <div className="space-y-3">
              <label className="font-bold text-gray-900">ملاحظات خاصة (اختياري)</label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="مثال: بدون بصل، إضافة جبن..."
                rows={3}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0 transition-colors"
              />
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-6 p-4 bg-white rounded-2xl shadow-md">
              <span className="font-bold text-gray-900">الكمية:</span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="text-2xl font-black text-gray-900 min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={!meal.is_available || adding}
              className="w-full py-5 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl font-black text-lg hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <UtensilsCrossed className="w-6 h-6" />
              {adding ? 'جاري الإضافة...' : meal.is_available ? 'أضف للطلب' : 'غير متوفر'}
            </button>

            {/* Info Alert */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p>
                  سيتم توصيل طلبك خلال {deliveryInfo.time} دقيقة.
                </p>
                <p className="mt-1">
                  رسوم التوصيل: {formatPrice(deliveryInfo.fee)}
                  {deliveryInfo.distance > 0 && (
                    <span className="text-blue-600"> (المسافة: {deliveryInfo.distance} كم)</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
