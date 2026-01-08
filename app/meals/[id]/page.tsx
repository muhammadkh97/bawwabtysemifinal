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
    name: string;
    name_ar: string;
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
          vendors!products_vendor_id_stores_fkey(
            name,
            name_ar,
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
        .from('stores')
        .select('business_type')
        .eq('id', data.vendor_id)
        .single();

      if (vendorData?.business_type !== 'restaurant') {
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
            {meal.vendors?.name_ar || meal.vendors?.name}
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
              </div>
            </div>
            
            {/* Thumbnails */}
            {meal.images && meal.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {meal.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border-4 transition-all ${
                      selectedImage === index ? 'border-orange-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Meal Info */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <Link 
                  href={`/vendor/${meal.vendor_id}`}
                  className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm hover:shadow-md transition-all"
                >
                  <img src={meal.vendors?.shop_logo} alt="" className="w-8 h-8 rounded-full object-cover" />
                  <span className="font-bold text-gray-700">{meal.vendors?.name_ar || meal.vendors?.name}</span>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-black">{meal.vendors?.rating?.toFixed(1)}</span>
                  </div>
                </Link>
                
                <button 
                  onClick={handleToggleWishlist}
                  className={`p-4 rounded-2xl shadow-sm transition-all ${
                    isInWishlist(meal.id) 
                      ? 'bg-red-50 text-red-500' 
                      : 'bg-white text-gray-400 hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${isInWishlist(meal.id) ? 'fill-current' : ''}`} />
                </button>
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 leading-tight">
                {meal.name_ar || meal.name}
              </h1>
              
              <div className="flex items-center gap-6 text-gray-500">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <span className="font-bold">{meal.preparation_time} دقيقة</span>
                </div>
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-orange-500" />
                  <span className="font-bold">وجبة طازجة</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-xl border border-orange-100">
              <div className="flex items-end gap-4 mb-8">
                <div className="text-5xl font-black text-orange-600">
                  {formatPrice(calculateTotalPrice())}
                </div>
                {meal.old_price && (
                  <div className="text-2xl text-gray-400 line-through mb-2">
                    {formatPrice(meal.old_price * quantity)}
                  </div>
                )}
              </div>

              {/* Variants */}
              {meal.has_variants && meal.variants && (
                <div className="space-y-8 mb-8">
                  {meal.variants.map((variant) => (
                    <div key={variant.id} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-gray-900">
                          {variant.name_ar || variant.name}
                          {variant.required && <span className="text-red-500 mr-1">*</span>}
                        </h3>
                        {variant.required && (
                          <span className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded-lg font-bold">إجباري</span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {variant.options.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => setSelectedVariants(prev => ({ ...prev, [variant.id]: option.id }))}
                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                              selectedVariants[variant.id] === option.id
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-gray-100 hover:border-orange-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                selectedVariants[variant.id] === option.id ? 'border-orange-500' : 'border-gray-300'
                              }`}>
                                {selectedVariants[variant.id] === option.id && (
                                  <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />
                                )}
                              </div>
                              <span className="font-bold text-gray-700">{option.name_ar || option.name}</span>
                            </div>
                            {option.price_modifier > 0 && (
                              <span className="text-sm font-black text-orange-600">+{formatPrice(option.price_modifier)}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quantity */}
              <div className="flex items-center gap-6 mb-8">
                <span className="text-lg font-black text-gray-900">الكمية</span>
                <div className="flex items-center bg-gray-100 rounded-2xl p-2">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm hover:bg-orange-50 transition-colors"
                  >
                    <Minus className="w-5 h-5 text-orange-600" />
                  </button>
                  <span className="w-16 text-center text-2xl font-black text-gray-900">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm hover:bg-orange-50 transition-colors"
                  >
                    <Plus className="w-5 h-5 text-orange-600" />
                  </button>
                </div>
              </div>

              {/* Special Instructions */}
              <div className="space-y-3 mb-8">
                <label className="text-lg font-black text-gray-900 block">ملاحظات خاصة</label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="مثال: بدون بصل، زيادة شطة..."
                  className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-orange-500 focus:ring-0 transition-all resize-none h-24"
                />
              </div>

              <button
                onClick={handleAddToCart}
                disabled={adding || !meal.is_available}
                className={`w-full py-6 rounded-2xl text-xl font-black flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-2xl active:scale-95 ${
                  meal.is_available
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {adding ? (
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus className="w-6 h-6" />
                    {meal.is_available ? 'إضافة لسلة الطلبات' : 'غير متوفر حالياً'}
                  </>
                )}
              </button>
            </div>

            {/* Delivery Info Card */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-3xl border border-gray-100 text-center">
                <div className="text-gray-400 text-xs font-bold mb-1">رسوم التوصيل</div>
                <div className="text-orange-600 font-black">{formatPrice(deliveryInfo.fee)}</div>
              </div>
              <div className="bg-white p-4 rounded-3xl border border-gray-100 text-center">
                <div className="text-gray-400 text-xs font-bold mb-1">وقت التوصيل</div>
                <div className="text-orange-600 font-black">{deliveryInfo.time} دقيقة</div>
              </div>
              <div className="bg-white p-4 rounded-3xl border border-gray-100 text-center">
                <div className="text-gray-400 text-xs font-bold mb-1">المسافة</div>
                <div className="text-orange-600 font-black">{deliveryInfo.distance} كم</div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-20">
          <h2 className="text-3xl font-black text-gray-900 mb-8">عن هذه الوجبة</h2>
          <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-xl border border-orange-50">
            <p className="text-xl text-gray-600 leading-relaxed whitespace-pre-line">
              {meal.description_ar || meal.description}
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
