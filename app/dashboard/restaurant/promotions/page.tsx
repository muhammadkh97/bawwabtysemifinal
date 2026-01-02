'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import { Tag, Percent, Gift, Plus, Calendar, TrendingUp, Users } from 'lucide-react';

interface Promotion {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_uses: number;
  current_uses: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export default function RestaurantPromotionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [vendorId, setVendorId] = useState<string>('');
  const [newPromotion, setNewPromotion] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: 0,
    min_order_amount: 0,
    max_uses: 100,
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (vendorData) {
        setVendorId(vendorData.id);
        await fetchPromotions(vendorData.id);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      router.push('/auth/login');
    }
  };

  const fetchPromotions = async (vId: string) => {
    try {
      const { data: couponsData } = await supabase
        .from('coupons')
        .select('*')
        .eq('vendor_id', vId)
        .order('created_at', { ascending: false });

      const formattedPromotions: Promotion[] = couponsData?.map((coupon: any) => ({
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        min_order_amount: coupon.min_order_amount || 0,
        max_uses: coupon.max_uses || 0,
        current_uses: coupon.current_uses || 0,
        start_date: coupon.start_date,
        end_date: coupon.end_date,
        is_active: coupon.is_active
      })) || [];

      setPromotions(formattedPromotions);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    }
  };

  const handleAddPromotion = async () => {
    if (!newPromotion.code || !newPromotion.discount_value) {
      alert('الرجاء ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      const { error } = await supabase
        .from('coupons')
        .insert({
          vendor_id: vendorId,
          code: newPromotion.code.toUpperCase(),
          discount_type: newPromotion.discount_type,
          discount_value: newPromotion.discount_value,
          min_order_amount: newPromotion.min_order_amount,
          max_uses: newPromotion.max_uses,
          current_uses: 0,
          start_date: newPromotion.start_date,
          end_date: newPromotion.end_date,
          is_active: true
        });

      if (error) throw error;

      alert('تم إضافة العرض بنجاح');
      setShowAddModal(false);
      fetchPromotions(vendorId);
      setNewPromotion({
        code: '',
        discount_type: 'percentage',
        discount_value: 0,
        min_order_amount: 0,
        max_uses: 100,
        start_date: '',
        end_date: ''
      });
    } catch (error) {
      console.error('Error adding promotion:', error);
      alert('حدث خطأ في إضافة العرض');
    }
  };

  const togglePromotionStatus = async (promotionId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !currentStatus })
        .eq('id', promotionId);

      if (error) throw error;

      fetchPromotions(vendorId);
      alert(currentStatus ? 'تم تعطيل العرض' : 'تم تفعيل العرض');
    } catch (error) {
      console.error('Error:', error);
      alert('حدث خطأ في تحديث حالة العرض');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <FuturisticNavbar />
      <div className="flex">
        <FuturisticSidebar role="restaurant" />
        <div className="md:mr-[280px] transition-all duration-300 w-full">
          <main className="pt-16 sm:pt-20 md:pt-24 px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 md:pb-10">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-black text-gray-900 mb-2">🎁 العروض والكوبونات</h1>
                <p className="text-gray-600">إدارة العروض الترويجية وكوبونات الخصم</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold hover:shadow-lg transition"
              >
                <Plus className="w-5 h-5" />
                إضافة عرض جديد
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
              <Tag className="w-10 h-10 mb-2" />
              <h3 className="text-3xl font-bold mb-1">{promotions.length}</h3>
              <p className="text-purple-100">إجمالي العروض</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
              <TrendingUp className="w-10 h-10 mb-2" />
              <h3 className="text-3xl font-bold mb-1">{promotions.filter(p => p.is_active).length}</h3>
              <p className="text-green-100">عروض نشطة</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
              <Users className="w-10 h-10 mb-2" />
              <h3 className="text-3xl font-bold mb-1">
                {promotions.reduce((sum, p) => sum + p.current_uses, 0)}
              </h3>
              <p className="text-blue-100">مرات الاستخدام</p>
            </div>
          </div>

          {/* Promotions List */}
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">قائمة العروض</h2>
            
            {promotions.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {promotions.map((promotion, index) => (
                  <motion.div
                    key={promotion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white">
                          <Gift className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-purple-900">{promotion.code}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            promotion.is_active 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {promotion.is_active ? 'نشط' : 'معطل'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => togglePromotionStatus(promotion.id, promotion.is_active)}
                        className="px-3 py-1 bg-white rounded-lg text-sm font-bold text-purple-600 hover:bg-purple-100 transition"
                      >
                        {promotion.is_active ? 'تعطيل' : 'تفعيل'}
                      </button>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">الخصم:</span>
                        <span className="font-bold text-purple-900">
                          {promotion.discount_type === 'percentage' 
                            ? `${promotion.discount_value}%` 
                            : `${promotion.discount_value} ₪`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">الحد الأدنى:</span>
                        <span className="font-bold text-gray-900">{promotion.min_order_amount} ₪</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">الاستخدام:</span>
                        <span className="font-bold text-gray-900">
                          {promotion.current_uses} / {promotion.max_uses}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-purple-200">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{new Date(promotion.start_date).toLocaleDateString('ar-EG')}</span>
                        <span>→</span>
                        <span>{new Date(promotion.end_date).toLocaleDateString('ar-EG')}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">لا توجد عروض بعد</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition"
                >
                  إضافة عرض الآن
                </button>
              </div>
            )}
          </div>

          {/* Add Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-6">إضافة عرض جديد</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">كود العرض</label>
                    <input
                      type="text"
                      value={newPromotion.code}
                      onChange={(e) => setNewPromotion({...newPromotion, code: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="RAMADAN2026"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">نوع الخصم</label>
                    <select
                      value={newPromotion.discount_type}
                      onChange={(e) => setNewPromotion({...newPromotion, discount_type: e.target.value as any})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="percentage">نسبة مئوية (%)</option>
                      <option value="fixed">مبلغ ثابت (₪)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">قيمة الخصم</label>
                    <input
                      type="number"
                      value={newPromotion.discount_value}
                      onChange={(e) => setNewPromotion({...newPromotion, discount_value: parseFloat(e.target.value)})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">الحد الأدنى للطلب</label>
                    <input
                      type="number"
                      value={newPromotion.min_order_amount}
                      onChange={(e) => setNewPromotion({...newPromotion, min_order_amount: parseFloat(e.target.value)})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">عدد مرات الاستخدام</label>
                    <input
                      type="number"
                      value={newPromotion.max_uses}
                      onChange={(e) => setNewPromotion({...newPromotion, max_uses: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ البداية</label>
                      <input
                        type="date"
                        value={newPromotion.start_date}
                        onChange={(e) => setNewPromotion({...newPromotion, start_date: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ الانتهاء</label>
                      <input
                        type="date"
                        value={newPromotion.end_date}
                        onChange={(e) => setNewPromotion({...newPromotion, end_date: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={handleAddPromotion}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition"
                  >
                    إضافة
                  </button>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition"
                  >
                    إلغاء
                  </button>
                </div>
              </motion.div>
            </div>
          )}
          </main>
        </div>
      </div>
    </>
  );
}
