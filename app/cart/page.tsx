'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import EmptyState from '@/components/EmptyState';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

export default function CartPage() {
  const { user } = useAuth();
  const { cartItems, loading, updateQuantity, removeFromCart } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discount: number} | null>(null);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [userPoints, setUserPoints] = useState(0);
  const pointsValue = 0.10; // قيمة النقطة بالعملة

  // Fetch user points
  useEffect(() => {
    async function fetchUserPoints() {
      if (!user) return;

      try {
        const { data: userData } = await supabase
          .from('users')
          .select('loyalty_points')
          .eq('id', user.id)
          .single();
        
        if (userData) {
          setUserPoints(userData.loyalty_points || 0);
        }
      } catch (error) {
        console.error('Error fetching user points:', error);
      }
    }

    fetchUserPoints();
  }, [user]);

  const handleUpdateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const item = cartItems.find(i => i.id === id);
    if (!item) return;

    const finalQuantity = Math.min(newQuantity, item.product?.stock || 100);
    await updateQuantity(id, finalQuantity);
  };

  const handleRemoveItem = async (id: string) => {
    await removeFromCart(id);
  };

  const applyCoupon = () => {
    if (couponCode.toLowerCase() === 'save10') {
      setAppliedCoupon({ code: couponCode, discount: 10 });
      alert('✅ تم تطبيق كوبون الخصم!');
    } else {
      alert('❌ كود الخصم غير صحيح');
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
  const discount = appliedCoupon ? (subtotal * appliedCoupon.discount) / 100 : 0;
  const pointsDiscount = usePoints ? pointsToUse * pointsValue : 0;
  const shipping = subtotal > 200 ? 0 : 15;
  const total = Math.max(0, subtotal - discount - pointsDiscount + shipping);

  const maxPointsCanUse = Math.min(userPoints, Math.floor((subtotal - discount) / pointsValue));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-800 font-bold">جاري تحميل السلة...</p>
            </div>
          </div>
        )}

        {/* Not logged in */}
        {!loading && !user && (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">🔒</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">يجب تسجيل الدخول</h2>
            <p className="text-gray-600 mb-8 text-lg">سجل الدخول لعرض سلة التسوق الخاصة بك</p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all"
              style={{ background: 'linear-gradient(90deg, #6236FF, #FF219D)' }}
            >
              <span>تسجيل الدخول</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}

        {/* Empty Cart */}
        {!loading && user && cartItems.length === 0 && (
          <EmptyState type="cart" />
        )}

        {!loading && user && cartItems.length > 0 && (
          <>
            {/* العنوان */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <h1 className="text-5xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <ShoppingBag className="w-12 h-12 text-purple-600" />
                سلة التسوق
              </h1>
              <p className="text-gray-600 text-lg">
                لديك {cartItems.length} منتج في السلة
              </p>
            </motion.div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* قائمة المنتجات */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 rounded-3xl bg-white shadow-lg border border-purple-100"
                    style={{
                      backdropFilter: 'blur(20px)'
                    }}
                  >
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* الصورة */}
                      <div className="relative w-full md:w-32 h-32 rounded-2xl overflow-hidden bg-white/5 flex-shrink-0">
                        <Image
                          src={item.product?.images?.[0] || 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=500'}
                          alt={item.product?.name || 'منتج'}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* المعلومات */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{item.product?.name || 'منتج'}</h3>
                            <p className="text-purple-600 text-sm">{item.product?.vendor_name || 'متجر'}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-500 hover:text-red-600 transition p-2 hover:bg-red-50 rounded-xl"
                          >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      {/* المخزون */}
                      <p className="text-sm text-green-600 mb-4">
                        ✅ متوفر ({item.product?.stock || 0} قطعة)
                      </p>

                      {/* السعر والكمية */}
                      <div className="flex items-center justify-between">
                        {/* السعر */}
                        <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                          {((item.product?.price || 0) * item.quantity).toFixed(2)} د.أ
                        </div>

                        {/* التحكم بالكمية */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-100 hover:bg-purple-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
                          >
                            <Minus className="w-5 h-5 text-purple-700" />
                          </button>
                          <span className="text-gray-900 font-bold text-xl min-w-[3ch] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= (item.product?.stock || 0)}
                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-100 hover:bg-purple-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
                          >
                            <Plus className="w-5 h-5 text-purple-700" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* ملخص الطلب */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="sticky top-24 space-y-6"
              >
                {/* ملخص السعر */}
                <div
                  className="p-6 rounded-3xl bg-white shadow-lg border border-purple-100"
                  style={{
                    backdropFilter: 'blur(20px)'
                  }}
                >
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">ملخص الطلب</h3>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between text-gray-700">
                      <span>المجموع الفرعي</span>
                      <span className="font-bold">{subtotal.toFixed(2)} د.أ</span>
                    </div>

                    {appliedCoupon && (
                      <div className="flex items-center justify-between text-green-600">
                        <span>خصم ({appliedCoupon.discount}%)</span>
                        <span className="font-bold">-{discount.toFixed(2)} د.أ</span>
                      </div>
                    )}

                    {usePoints && pointsToUse > 0 && (
                      <div className="flex items-center justify-between text-yellow-600">
                        <span>خصم نقاط الولاء ({pointsToUse} نقطة)</span>
                        <span className="font-bold">-{pointsDiscount.toFixed(2)} د.أ</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-gray-700">
                      <span>الشحن</span>
                      <span className="font-bold">
                        {shipping === 0 ? 'مجاني' : `${shipping.toFixed(2)} د.أ`}
                      </span>
                    </div>

                    {shipping > 0 && (
                      <p className="text-sm text-orange-600">
                        💡 أضف {(200 - subtotal).toFixed(2)} د.أ للحصول على شحن مجاني
                      </p>
                    )}

                    <div className="h-px bg-purple-200"></div>

                    <div className="flex items-center justify-between text-gray-900 text-xl">
                      <span className="font-bold">الإجمالي</span>
                      <span className="font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                        {total.toFixed(2)} د.أ
                      </span>
                    </div>
                  </div>

                  <Link
                    href="/checkout"
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold text-lg transition-all hover:shadow-lg hover:shadow-purple-500/50"
                    style={{ background: 'linear-gradient(90deg, #6236FF, #FF219D)' }}
                  >
                    <span>إتمام الطلب</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>

                  <Link
                    href="/products"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-purple-600 font-medium mt-3 hover:bg-purple-50 transition border border-purple-200"
                  >
                    متابعة التسوق
                  </Link>
                </div>

                {/* كوبون الخصم */}
                <div
                  className="p-6 rounded-3xl bg-white shadow-lg border border-purple-100"
                  style={{
                    backdropFilter: 'blur(20px)'
                  }}
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-purple-600" />
                    كود الخصم
                  </h3>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="أدخل الكود"
                      className="flex-1 px-4 py-3 rounded-xl text-gray-900 bg-gray-50 border border-purple-200 focus:border-purple-500 focus:outline-none placeholder-gray-400"
                    />
                    <button
                      onClick={applyCoupon}
                      className="px-6 py-3 rounded-xl text-white font-bold hover:opacity-80 transition"
                      style={{ background: 'linear-gradient(90deg, #6236FF, #FF219D)' }}
                    >
                      تطبيق
                    </button>
                  </div>

                  <p className="text-sm text-purple-600 mt-3">
                    💡 جرب الكود: <code className="px-2 py-1 bg-purple-100 rounded text-purple-700">SAVE10</code>
                  </p>
                </div>

                {/* نقاط الولاء */}
                <div
                  className="p-6 rounded-3xl"
                  style={{
                    background: usePoints ? 'rgba(251, 191, 36, 0.1)' : 'white',
                    backdropFilter: 'blur(20px)',
                    border: usePoints ? '2px solid rgba(251, 191, 36, 0.5)' : '1px solid rgba(147, 51, 234, 0.2)'
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-yellow-500" />
                      استخدم نقاط الولاء
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={usePoints}
                        onChange={(e) => {
                          setUsePoints(e.target.checked);
                          if (!e.target.checked) setPointsToUse(0);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-yellow-400 peer-checked:to-orange-500"></div>
                    </label>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-purple-200">
                      <span>نقاطك المتاحة</span>
                      <span className="font-bold text-yellow-400">{userPoints} نقطة</span>
                    </div>

                    {usePoints && (
                      <>
                        <div className="flex items-center justify-between text-purple-200">
                          <span>الحد الأقصى للاستخدام</span>
                          <span className="font-bold text-green-400">{maxPointsCanUse} نقطة</span>
                        </div>

                        <div>
                          <label className="block text-sm text-purple-200 mb-2">
                            عدد النقاط للاستخدام
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min="0"
                              max={maxPointsCanUse}
                              value={pointsToUse}
                              onChange={(e) => setPointsToUse(Math.min(Number(e.target.value), maxPointsCanUse))}
                              className="flex-1 px-4 py-3 rounded-xl text-white bg-white/5 border border-yellow-500/30 focus:border-yellow-500 focus:outline-none"
                              placeholder="0"
                            />
                            <button
                              onClick={() => setPointsToUse(maxPointsCanUse)}
                              className="px-4 py-3 rounded-xl text-white font-bold hover:opacity-80 transition"
                              style={{ background: 'linear-gradient(90deg, #f59e0b, #d97706)' }}
                            >
                              الكل
                            </button>
                          </div>
                        </div>

                        <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                          <p className="text-sm text-yellow-300">
                            💰 قيمة الخصم: {pointsDiscount.toFixed(2)} ر.س
                          </p>
                        </div>
                      </>
                    )}

                    <p className="text-xs text-gray-600">
                      💡 كل نقطة = {pointsValue.toFixed(2)} ر.س
                    </p>
                  </div>
                </div>

                {/* مميزات */}
                <div
                  className="p-6 rounded-3xl bg-white shadow-lg border border-purple-100"
                  style={{
                    backdropFilter: 'blur(20px)'
                  }}
                >
                  <div className="space-y-4 text-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                        <span>✅</span>
                      </div>
                      <div>
                        <p className="font-bold text-white">دفع آمن</p>
                        <p className="text-sm">معاملات محمية 100%</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <span>🚚</span>
                      </div>
                      <div>
                        <p className="font-bold text-white">توصيل سريع</p>
                        <p className="text-sm">خلال 2-4 أيام عمل</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                        <span>↩️</span>
                      </div>
                      <div>
                        <p className="font-bold text-white">إرجاع مجاني</p>
                        <p className="text-sm">خلال 14 يوم</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

