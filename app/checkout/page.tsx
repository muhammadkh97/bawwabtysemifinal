'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { logger } from '@/lib/logger';
import { 
  ShoppingCart, MapPin, CreditCard, Truck, CheckCircle, Package, 
  ArrowRight, ArrowLeft, Tag, X, AlertCircle, Sparkles, User, 
  Phone, Mail, Home, Navigation, Loader2, ChevronRight, Gift
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { motion, AnimatePresence } from 'framer-motion';

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">جاري تحميل الخريطة...</p>
      </div>
    </div>
  ),
});

interface City {
  [key: string]: string;
}

interface CitiesByCountry {
  [country: string]: City;
}

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { formatPrice } = useCurrency();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userCountry, setUserCountry] = useState<string>('فلسطين');
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
    notes: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    paymentMethod: 'cash' as 'cash' | 'card',
  });

  // حالة الكوبون
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [shippingSettings, setShippingSettings] = useState<{
    base_fee: number;
    free_shipping_threshold: number;
    is_free: boolean;
  }>({ base_fee: 20, free_shipping_threshold: 200, is_free: false });

  // قوائم المدن لكل دولة
  const citiesByCountry: CitiesByCountry = {
    'فلسطين': {
      'القدس': '91000',
      'غزة': '79700',
      'رام الله': '90600',
      'الخليل': '90100',
      'نابلس': '44100',
      'بيت لحم': '90500',
      'جنين': '13700',
      'طولكرم': '87100',
      'قلقيلية': '84300',
      'سلفيت': '64200',
    },
    'الأردن': {
      'عمّان': '11110',
      'الزرقاء': '13110',
      'إربد': '21110',
      'العقبة': '77110',
      'السلط': '19110',
      'المفرق': '26110',
    },
    'السعودية': {
      'الرياض': '11564',
      'جدة': '21589',
      'مكة': '24231',
      'المدينة': '42311',
      'الدمام': '32256',
      'الخبر': '34441',
    },
    'مصر': {
      'القاهرة': '11511',
      'الإسكندرية': '21500',
      'الجيزة': '12511',
      'بورسعيد': '42511',
    },
  };

  const subtotal = cartTotal;
  const shipping = shippingSettings.is_free 
    ? 0 
    : (subtotal >= shippingSettings.free_shipping_threshold ? 0 : shippingSettings.base_fee);
  const tax = subtotal * 0.1;
  const total = subtotal + shipping + tax - discount;

  // جلب إعدادات الشحن
  useEffect(() => {
    const fetchShippingSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('shipping_settings')
          .select('*')
          .single();

        if (!error && data) {
          setShippingSettings({
            base_fee: data.base_fee || 20,
            free_shipping_threshold: data.free_shipping_threshold || 200,
            is_free: data.is_free || false,
          });
        }
      } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching shipping settings', { error: errorMessage, component: 'CheckoutPage' });
    fetchShippingSettings();
  }, []);

  // جلب دولة المستخدم ومعلوماته
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('country, name, phone, email')
            .eq('id', user.id)
            .single();

          if (userData) {
            setUserCountry(userData.country || 'فلسطين');
            setFormData(prev => ({
              ...prev,
              fullName: userData.name || '',
              phone: userData.phone || '',
              email: userData.email || '',
            }));
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error('Error fetching user data', { error: errorMessage, component: 'CheckoutPage' });
        }
      }
    };

    fetchUserData();
  }, [user]);

  const getCurrentCountryCities = () => {
    return citiesByCountry[userCountry] || citiesByCountry['فلسطين'];
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'city' && value) {
      const cities = getCurrentCountryCities();
      const postalCode = cities[value] || '';
      setFormData({
        ...formData,
        city: value,
        postalCode,
      });
      return;
    }
    
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('❌ المتصفح لا يدعم خاصية تحديد الموقع');
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`
          );
          
          if (!response.ok) throw new Error('Failed to fetch address');
          
          const data = await response.json();
          const address = data.address;
          
          const fullAddress = [
            address.road || address.street || '',
            address.suburb || address.neighbourhood || '',
          ].filter(Boolean).join(', ') || data.display_name;

          const detectedCity = address.city || address.town || address.village || '';
          const cities = getCurrentCountryCities();
          const matchedCity = Object.keys(cities).find(city => 
            detectedCity.toLowerCase().includes(city.toLowerCase()) || 
            city.toLowerCase().includes(detectedCity.toLowerCase())
          );

          setFormData({
            ...formData,
            address: fullAddress,
            city: matchedCity || detectedCity,
            postalCode: matchedCity ? cities[matchedCity] : '',
            latitude,
            longitude,
          });

          alert(`✅ تم تحديد موقعك بنجاح!\n📍 ${fullAddress}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error('Error getting location', { error: errorMessage, component: 'CheckoutPage' });
          alert('❌ حدث خطأ في تحديد الموقع');
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        const errorMessage = error instanceof GeolocationPositionError ? error.message : 'Unknown error';
        logger.error('Geolocation error', { error: errorMessage, code: error instanceof GeolocationPositionError ? error.code : undefined, component: 'CheckoutPage' });
        alert('❌ تعذر الوصول إلى موقعك');
        setIsGettingLocation(false);
      }
    );
  };

  const handleLocationSelect = async (lat: number, lng: number, address?: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`
      );
      
      if (response.ok) {
        const data = await response.json();
        const addressData = data.address;
        const detectedCity = addressData.city || addressData.town || '';
        
        const cities = getCurrentCountryCities();
        const matchedCity = Object.keys(cities).find(city => 
          detectedCity.toLowerCase().includes(city.toLowerCase())
        );

        setFormData({
          ...formData,
          latitude: lat,
          longitude: lng,
          address: address || formData.address,
          city: matchedCity || detectedCity || formData.city,
          postalCode: matchedCity ? cities[matchedCity] : formData.postalCode,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error selecting location', { error: errorMessage, component: 'CheckoutPage', lat, lng });
    }
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      alert('⚠️ يرجى إدخال رمز الكوبون');
      return;
    }

    setCouponLoading(true);

    try {
      const vendorId = cartItems[0]?.product?.vendor_id;
      if (!vendorId) {
        alert('❌ خطأ في تحديد البائع');
        setCouponLoading(false);
        return;
      }

      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('vendor_id', vendorId)
        .eq('is_active', true)
        .single();

      if (error || !coupon) {
        alert('❌ كوبون غير صالح');
        setCouponLoading(false);
        return;
      }

      const now = new Date();
      if (now < new Date(coupon.start_date) || now > new Date(coupon.end_date)) {
        alert('❌ الكوبون منتهي الصلاحية');
        setCouponLoading(false);
        return;
      }

      if (coupon.used_count >= coupon.usage_limit) {
        alert('❌ تم استخدام الكوبون بالكامل');
        setCouponLoading(false);
        return;
      }

      if (subtotal < coupon.min_purchase) {
        alert(`❌ الحد الأدنى للطلب: ${coupon.min_purchase} ₪`);
        setCouponLoading(false);
        return;
      }

      let discountAmount = 0;
      if (coupon.discount_type === 'percentage') {
        discountAmount = (subtotal * coupon.discount_value) / 100;
        if (coupon.max_discount) {
          discountAmount = Math.min(discountAmount, coupon.max_discount);
        }
      } else {
        discountAmount = coupon.discount_value;
      }

      discountAmount = Math.min(discountAmount, subtotal);

      setAppliedCoupon(coupon);
      setDiscount(discountAmount);
      alert(`✅ تم تطبيق الكوبون! وفرت ${discountAmount.toFixed(2)} ₪ 🎉`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error validating coupon', { error: errorMessage, component: 'CheckoutPage', couponCode });
      alert('❌ حدث خطأ أثناء التحقق من الكوبون');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponCode('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    if (!user || cartItems.length === 0) {
      alert('❌ يرجى تسجيل الدخول والتأكد من وجود منتجات في السلة');
      return;
    }

    setLoading(true);

    try {
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // جلب vendor_id من أول منتج في السلة
      let firstVendorId = cartItems[0]?.product?.vendor_id;
      
      // إذا لم يكن موجوداً في الكاش، نجلبه من قاعدة البيانات
      if (!firstVendorId && cartItems.length > 0) {
        const firstProductId = cartItems[0]?.product?.id;
        if (firstProductId) {
          const { data: productData } = await supabase
            .from('products')
            .select('vendor_id')
            .eq('id', firstProductId)
            .single();
          firstVendorId = productData?.vendor_id;
        }
      }

      // التأكد من وجود vendor_id
      if (!firstVendorId) {
        alert('❌ خطأ: لا يمكن تحديد البائع للطلب');
        setLoading(false);
        return;
      }

      // بناء items من السلة للحفظ في orders.items (jsonb)
      const orderItemsSnapshot = cartItems.map(item => ({
        product_id: item.product?.id,
        name: item.product?.name || '',
        quantity: item.quantity,
        price: item.product?.price || 0,
        image: item.product?.images?.[0] || '',
      }));

      const orderData: any = {
        order_number: orderNumber,
        customer_id: user.id,
        vendor_id: firstVendorId,
        items: orderItemsSnapshot,
        status: 'pending',
        subtotal: subtotal,
        delivery_fee: shipping,
        tax: tax,
        discount: discount,
        total: total,
        payment_method: formData.paymentMethod,
        payment_status: formData.paymentMethod === 'cash' ? 'pending' : 'paid',
        coupon_id: appliedCoupon?.id || null,
        delivery_address: `${formData.address}, ${formData.city}, ${userCountry}`,
        delivery_lat: formData.latitude,
        delivery_lng: formData.longitude,
        delivery_notes: formData.notes,
      };

      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select('id, order_number')
        .single();

      if (orderError || !newOrder) {
        logger.error('Order creation error', { error: orderError?.message, component: 'CheckoutPage', orderData });
        alert(`❌ حدث خطأ: ${orderError?.message || 'فشل إنشاء الطلب'}`);
        setLoading(false);
        return;
      }

      // جلب vendor_id من قاعدة البيانات للمنتجات
      const productIds = cartItems
        .filter(item => item.product)
        .map(item => item.product!.id);

      const { data: productsFromDB } = await supabase
        .from('products')
        .select('id, vendor_id')
        .in('id', productIds);

      const vendorIdMap = new Map(
        productsFromDB?.map(p => [p.id, p.vendor_id]) || []
      );

      const orderItems = cartItems
        .filter(item => item.product)
        .map(item => {
          const product = item.product!;
          const finalPrice = (product as any).discount_price || product.price;
          
          // جلب vendor_id من قاعدة البيانات
          const vendorId = vendorIdMap.get(product.id) || product.vendor_id;
          
          const itemTotal = finalPrice * item.quantity;
          const commissionRate = 10.00; // نسبة عمولة المنصة 10%
          const commissionAmount = itemTotal * (commissionRate / 100);
          const vendorEarning = itemTotal - commissionAmount;
          
          return {
            order_id: newOrder.id,
            product_id: product.id,
            vendor_id: vendorId,
            name: product.name,
            name_ar: (product as any).name_ar || product.name,
            product_name: product.name,
            product_name_ar: (product as any).name_ar || product.name,
            product_image: product.images?.[0] || null,
            quantity: item.quantity,
            price: finalPrice,
            unit_price: finalPrice,
            total: itemTotal,
            item_total: itemTotal,
            commission_rate: commissionRate,
            commission_amount: commissionAmount,
            vendor_earning: vendorEarning,
          };
        })
        .filter(item => item.vendor_id); // ✅ تصفية المنتجات التي ليس لها vendor_id

      // التحقق من وجود منتجات صالحة
      if (orderItems.length === 0) {
        await supabase.from('orders').delete().eq('id', newOrder.id);
        alert('❌ عذراً، المنتجات في السلة غير صالحة. يرجى إضافة منتجات من المتاجر المسجلة.');
        setLoading(false);
        return;
      }


      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        logger.error('Items insertion error', { error: itemsError.message, component: 'CheckoutPage', orderId: newOrder.id, itemsCount: orderItems.length });
        await supabase.from('orders').delete().eq('id', newOrder.id);
        alert(`❌ حدث خطأ في إضافة المنتجات: ${itemsError.message}`);
        setLoading(false);
        return;
      }

      for (const item of cartItems) {
        if (item.product && item.product.stock > 0) {
          await supabase
            .from('products')
            .update({ stock: Math.max(0, item.product.stock - item.quantity) })
            .eq('id', item.product.id);
        }
      }

      if (appliedCoupon) {
        await supabase
          .from('coupons')
          .update({ used_count: appliedCoupon.used_count + 1 })
          .eq('id', appliedCoupon.id);
      }

      // إفراغ السلة من قاعدة البيانات و localStorage
      await clearCart();
      if (typeof window !== 'undefined') {
        (typeof window !== 'undefined' ? localStorage.removeItem('cartItems') : null);
      }

      alert(`✅ تم إتمام الطلب بنجاح! 🎉\nرقم الطلب: ${orderNumber}\n${discount > 0 ? `وفرت ${discount.toFixed(2)} ₪ 💰` : ''}`);
      
      setTimeout(() => {
        if (typeof window !== 'undefined') window.location.href = '/orders';
      }, 1500);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Unexpected checkout error', { error: errorMessage, component: 'CheckoutPage' });
      alert('❌ حدث خطأ غير متوقع');
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, title: 'معلومات الشحن', icon: MapPin },
    { num: 2, title: 'طريقة الدفع', icon: CreditCard },
    { num: 3, title: 'مراجعة الطلب', icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0515] via-[#1a0b2e] to-[#0f0721]" dir="rtl">
      <Header />
      
      <main className="container mx-auto px-4 py-12 mt-20">
        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-6 right-0 left-0 h-1 bg-white/10 -z-10"></div>
            <div 
              className="absolute top-6 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 -z-10"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            ></div>

            {steps.map((s, i) => (
              <div key={s.num} className="flex flex-col items-center flex-1">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: step >= s.num ? 1.1 : 1 }}
                  className={`w-14 h-14 rounded-full flex items-center justify-center font-bold transition-all duration-300 shadow-lg ${
                    step >= s.num
                      ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white'
                      : 'bg-white/10 backdrop-blur-sm text-gray-400'
                  }`}
                >
                  <s.icon className="w-6 h-6" />
                </motion.div>
                <span className={`mt-3 text-sm font-medium transition-colors ${
                  step >= s.num ? 'text-purple-400' : 'text-gray-500'
                }`}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <motion.form 
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl"
            >
              <AnimatePresence mode="wait">
                {/* Step 1: معلومات الشحن */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">معلومات الشحن</h2>
                        <p className="text-gray-400 text-sm">أدخل عنوان التوصيل</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-300 font-medium mb-2 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          الاسم الكامل
                        </label>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                          placeholder="أدخل اسمك الكامل"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-300 font-medium mb-2 flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          رقم الهاتف
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                          placeholder="+970 XXX XXXX"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-300 font-medium mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        البريد الإلكتروني
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                        placeholder="email@example.com"
                      />
                    </div>

                    {/* Location Buttons */}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleGetCurrentLocation}
                        disabled={isGettingLocation}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg transition disabled:opacity-50"
                      >
                        {isGettingLocation ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Navigation className="w-5 h-5" />
                        )}
                        تحديد موقعي الحالي
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowMapPicker(!showMapPicker)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition"
                      >
                        <MapPin className="w-5 h-5" />
                        اختيار من الخريطة
                      </button>
                    </div>

                    {showMapPicker && (
                      <div className="border-2 border-purple-300/30 rounded-2xl p-4 bg-white/5">
                        <LocationPicker
                          initialLat={formData.latitude || 31.9522}
                          initialLng={formData.longitude || 35.2332}
                          onLocationSelect={handleLocationSelect}
                          height="400px"
                          showCurrentLocation={true}
                          searchPlaceholder="ابحث عن عنوانك..."
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-gray-300 font-medium mb-2 flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        العنوان الكامل
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                        placeholder="الشارع، رقم المبنى، الطابق"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-300 font-medium mb-2">المدينة</label>
                        <select
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                        >
                          <option value="" className="bg-gray-800">اختر المدينة</option>
                          {Object.keys(getCurrentCountryCities()).map((city) => (
                            <option key={city} value={city} className="bg-gray-800">
                              {city}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-300 font-medium mb-2">الرمز البريدي</label>
                        <input
                          type="text"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                          placeholder="يُملأ تلقائياً"
                          readOnly
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-300 font-medium mb-2">ملاحظات إضافية</label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition resize-none"
                        placeholder="أي تعليمات خاصة للتوصيل..."
                      />
                    </div>
                  </motion.div>
                )}

                {/* Step 2: طريقة الدفع */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">طريقة الدفع</h2>
                        <p className="text-gray-400 text-sm">اختر طريقة الدفع المناسبة</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, paymentMethod: 'cash' })}
                        className={`p-6 rounded-2xl border-2 transition-all ${
                          formData.paymentMethod === 'cash'
                            ? 'border-purple-500 bg-purple-500/20'
                            : 'border-white/20 bg-white/5 hover:border-white/40'
                        }`}
                      >
                        <div className="text-4xl mb-3">💵</div>
                        <h3 className="text-white font-bold mb-1">الدفع عند الاستلام</h3>
                        <p className="text-gray-400 text-sm">ادفع نقداً عند وصول الطلب</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, paymentMethod: 'card' })}
                        className={`p-6 rounded-2xl border-2 transition-all ${
                          formData.paymentMethod === 'card'
                            ? 'border-purple-500 bg-purple-500/20'
                            : 'border-white/20 bg-white/5 hover:border-white/40'
                        }`}
                      >
                        <div className="text-4xl mb-3">💳</div>
                        <h3 className="text-white font-bold mb-1">بطاقة ائتمان</h3>
                        <p className="text-gray-400 text-sm">ادفع بأمان عبر الإنترنت</p>
                      </button>
                    </div>

                    {formData.paymentMethod === 'card' && (
                      <div className="p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                          <div>
                            <h4 className="text-white font-bold mb-2">الدفع الإلكتروني غير متاح حالياً</h4>
                            <p className="text-gray-400 text-sm">
                              نعمل على إضافة خيارات الدفع الإلكتروني قريباً. يرجى اختيار الدفع عند الاستلام.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Step 3: مراجعة الطلب */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">مراجعة الطلب</h2>
                        <p className="text-gray-400 text-sm">تأكد من صحة البيانات</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* معلومات الشحن */}
                      <div className="p-5 bg-white/5 rounded-2xl border border-white/20">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                          <MapPin className="w-5 h-5" />
                          معلومات الشحن
                        </h3>
                        <div className="space-y-2 text-sm">
                          <p className="text-gray-300"><strong>الاسم:</strong> {formData.fullName}</p>
                          <p className="text-gray-300"><strong>الهاتف:</strong> {formData.phone}</p>
                          <p className="text-gray-300"><strong>البريد:</strong> {formData.email}</p>
                          <p className="text-gray-300"><strong>العنوان:</strong> {formData.address}, {formData.city}</p>
                        </div>
                      </div>

                      {/* طريقة الدفع */}
                      <div className="p-5 bg-white/5 rounded-2xl border border-white/20">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                          <CreditCard className="w-5 h-5" />
                          طريقة الدفع
                        </h3>
                        <p className="text-gray-300">
                          {formData.paymentMethod === 'cash' ? '💵 الدفع عند الاستلام' : '💳 بطاقة ائتمان'}
                        </p>
                      </div>

                      {/* المنتجات */}
                      <div className="p-5 bg-white/5 rounded-2xl border border-white/20">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                          <Package className="w-5 h-5" />
                          المنتجات ({cartItems.length})
                        </h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {cartItems.filter(item => item.product).map((item) => (
                            <div key={item.product!.id} className="flex gap-3 p-3 bg-white/5 rounded-xl">
                              <img
                                src={item.product!.images?.[0] || ''}
                                alt={item.product!.name}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                              <div className="flex-1">
                                <h4 className="text-white font-medium text-sm">{item.product!.name}</h4>
                                <p className="text-gray-400 text-xs">الكمية: {item.quantity}</p>
                              </div>
                              <div className="text-white font-bold">
                                {formatPrice(((item.product as any).discount_price || item.product!.price) * item.quantity)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex gap-4 mt-8">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition"
                  >
                    <ArrowRight className="w-5 h-5" />
                    السابق
                  </button>
                )}
                
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:shadow-2xl transition disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : step === 3 ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      تأكيد الطلب
                    </>
                  ) : (
                    <>
                      التالي
                      <ArrowLeft className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-6 shadow-2xl sticky top-24"
            >
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <ShoppingCart className="w-6 h-6" />
                ملخص الطلب
              </h3>

              {/* Coupon */}
              {!appliedCoupon ? (
                <div className="mb-6">
                  <label className="block text-gray-300 font-medium mb-2 flex items-center gap-2">
                    <Gift className="w-4 h-4" />
                    كود الخصم
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 outline-none transition"
                      placeholder="أدخل الكود"
                    />
                    <button
                      type="button"
                      onClick={validateCoupon}
                      disabled={couponLoading}
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition disabled:opacity-50"
                    >
                      {couponLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تطبيق'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className="w-5 h-5 text-green-400" />
                      <span className="text-white font-medium">{appliedCoupon.code}</span>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-green-300 text-sm mt-1">وفرت {discount.toFixed(2)} ₪</p>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-300">
                  <span>المجموع الفرعي</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>الشحن</span>
                  <span className="font-medium">
                    {shipping === 0 ? (
                      <span className="text-green-400">مجاني 🎉</span>
                    ) : (
                      formatPrice(shipping)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>الضريبة (10%)</span>
                  <span className="font-medium">{formatPrice(tax)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>الخصم</span>
                    <span className="font-medium">-{formatPrice(discount)}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/20">
                <div className="flex justify-between text-white text-xl font-bold">
                  <span>الإجمالي</span>
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              {/* Security Badge */}
              <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">عملية آمنة 100%</p>
                    <p className="text-gray-400 text-xs">معلوماتك محمية بالكامل</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
