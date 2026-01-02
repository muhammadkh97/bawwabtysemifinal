'use client';

import { useState, useEffect } from 'react';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FloatingAddButton from '@/components/dashboard/FloatingAddButton';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  max_discount?: number;
  usage_limit: number;
  used_count: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export default function VendorCouponsPage() {
  const { userId } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    min_purchase: '',
    max_discount: '',
    usage_limit: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    if (userId) {
      fetchCoupons();
    }
  }, [userId]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      
      // Get vendor ID
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!vendorData) {
        setLoading(false);
        return;
      }

      setVendorId(vendorData.id);

      // Fetch coupons
      const { data: couponsData, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('vendor_id', vendorData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCoupons(couponsData || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const handleCreateCoupon = async () => {
    if (!vendorId) {
      alert('⚠️ خطأ: لم يتم العثور على معلومات البائع');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('coupons')
        .insert({
          vendor_id: vendorId,
          code: formData.code,
          description: formData.description,
          discount_type: formData.discount_type,
          discount_value: parseFloat(formData.discount_value),
          min_purchase: parseFloat(formData.min_purchase),
          max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
          usage_limit: parseInt(formData.usage_limit),
          used_count: 0,
          start_date: formData.start_date,
          end_date: formData.end_date,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      alert('✅ تم إنشاء الكوبون بنجاح!');
      await fetchCoupons();
      setShowCreateModal(false);
      setFormData({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        min_purchase: '',
        max_discount: '',
        usage_limit: '',
        start_date: '',
        end_date: '',
      });
    } catch (error) {
      console.error('Error creating coupon:', error);
      alert('❌ حدث خطأ أثناء إنشاء الكوبون');
    }
  };

  const toggleCouponStatus = async (id: string) => {
    try {
      const coupon = coupons.find(c => c.id === id);
      if (!coupon) return;

      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !coupon.is_active })
        .eq('id', id);

      if (error) throw error;

      setCoupons(coupons.map(c => 
        c.id === id ? { ...c, is_active: !c.is_active } : c
      ));
    } catch (error) {
      console.error('Error toggling coupon status:', error);
      alert('❌ حدث خطأ أثناء تحديث حالة الكوبون');
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الكوبون؟')) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCoupons(coupons.filter(c => c.id !== id));
      alert('✅ تم حذف الكوبون بنجاح');
    } catch (error) {
      console.error('Error deleting coupon:', error);
      alert('❌ حدث خطأ أثناء حذف الكوبون');
    }
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_purchase: coupon.min_purchase.toString(),
      max_discount: coupon.max_discount?.toString() || '',
      usage_limit: coupon.usage_limit.toString(),
      start_date: coupon.start_date,
      end_date: coupon.end_date,
    });
    setShowEditModal(true);
  };

  const handleUpdateCoupon = async () => {
    if (!editingCoupon) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .update({
          code: formData.code,
          description: formData.description,
          discount_type: formData.discount_type,
          discount_value: parseFloat(formData.discount_value),
          min_purchase: parseFloat(formData.min_purchase),
          max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
          usage_limit: parseInt(formData.usage_limit),
          start_date: formData.start_date,
          end_date: formData.end_date,
        })
        .eq('id', editingCoupon.id);

      if (error) throw error;

      alert('✅ تم تحديث الكوبون بنجاح!');
      await fetchCoupons();
      setShowEditModal(false);
      setEditingCoupon(null);
      setFormData({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        min_purchase: '',
        max_discount: '',
        usage_limit: '',
        start_date: '',
        end_date: '',
      });
    } catch (error) {
      console.error('Error updating coupon:', error);
      alert('❌ حدث خطأ أثناء تحديث الكوبون');
    }
  };

  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  const isUpcoming = (startDate: string) => {
    return new Date(startDate) > new Date();
  };

  const activeCoupons = coupons.filter(c => c.is_active && !isExpired(c.end_date));
  const expiredCoupons = coupons.filter(c => isExpired(c.end_date));

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-[#0A0515] transition-colors duration-300">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-800 dark:text-white text-xl">جاري تحميل الكوبونات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0A0515] transition-colors duration-300">
      <FuturisticSidebar role="vendor" />
      
      {/* Main Content Area */}
      <div className="md:mr-[280px] transition-all duration-300">
        <FuturisticNavbar userName="" userRole="بائع" />

        <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10 relative z-10 max-w-[1800px] mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                🎟️ كوبونات الخصم
              </h1>
              <p className="text-slate-600">{coupons.length} كوبون إجمالاً</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              ✨ إنشاء كوبون جديد
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 rounded-2xl shadow-lg">
              <p className="text-sm opacity-90 mb-2">كوبونات نشطة</p>
              <p className="text-4xl font-bold">{activeCoupons.length}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6 rounded-2xl shadow-lg">
              <p className="text-sm opacity-90 mb-2">إجمالي الاستخدامات</p>
              <p className="text-4xl font-bold">{coupons.reduce((sum, c) => sum + c.used_count, 0)}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-6 rounded-2xl shadow-lg">
              <p className="text-sm opacity-90 mb-2">منتهية الصلاحية</p>
              <p className="text-4xl font-bold">{expiredCoupons.length}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white p-6 rounded-2xl shadow-lg">
              <p className="text-sm opacity-90 mb-2">قيد الانتظار</p>
              <p className="text-4xl font-bold">{coupons.filter(c => isUpcoming(c.start_date)).length}</p>
            </div>
          </div>

          {/* Coupons List */}
          <div className="space-y-4">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className={`bg-white rounded-2xl shadow-lg p-6 border-2 transition-all hover:shadow-2xl ${
                  !coupon.is_active ? 'opacity-50 border-slate-200' :
                  isExpired(coupon.end_date) ? 'border-red-300' :
                  isUpcoming(coupon.start_date) ? 'border-yellow-300' :
                  'border-green-300'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Coupon Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl font-bold text-2xl">
                        {coupon.code}
                      </div>
                      <div>
                        {!coupon.is_active && (
                          <span className="px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-xs font-bold">
                            ⏸️ غير نشط
                          </span>
                        )}
                        {coupon.is_active && isExpired(coupon.end_date) && (
                          <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold">
                            ⏰ منتهي
                          </span>
                        )}
                        {coupon.is_active && isUpcoming(coupon.start_date) && (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
                            🔜 قريباً
                          </span>
                        )}
                        {coupon.is_active && !isExpired(coupon.end_date) && !isUpcoming(coupon.start_date) && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                            ✅ نشط
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-slate-700 mb-4">{coupon.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-3 rounded-xl">
                        <p className="text-xs text-slate-600 mb-1">نوع الخصم</p>
                        <p className="font-bold text-purple-600">
                          {coupon.discount_type === 'percentage' 
                            ? `${coupon.discount_value}%` 
                            : `${coupon.discount_value} د.أ`}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-xl">
                        <p className="text-xs text-slate-600 mb-1">الحد الأدنى</p>
                        <p className="font-bold text-blue-600">{coupon.min_purchase} د.أ</p>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-xl">
                        <p className="text-xs text-slate-600 mb-1">الاستخدام</p>
                        <p className="font-bold text-green-600">
                          {coupon.used_count} / {coupon.usage_limit}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-orange-50 to-red-50 p-3 rounded-xl">
                        <p className="text-xs text-slate-600 mb-1">ينتهي في</p>
                        <p className="font-bold text-orange-600">
                          {new Date(coupon.end_date).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-slate-600 mb-1">
                        <span>نسبة الاستخدام</span>
                        <span>{Math.round((coupon.used_count / coupon.usage_limit) * 100)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all"
                          style={{ width: `${(coupon.used_count / coupon.usage_limit) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span>📅 من {new Date(coupon.start_date).toLocaleDateString('ar-SA')}</span>
                      <span>•</span>
                      <span>إلى {new Date(coupon.end_date).toLocaleDateString('ar-SA')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col gap-2">
                    <button
                      onClick={() => openEditModal(coupon)}
                      className="flex-1 md:flex-none px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold hover:bg-blue-200 transition-all"
                    >
                      ✏️ تعديل
                    </button>
                    <button
                      onClick={() => toggleCouponStatus(coupon.id)}
                      className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-bold transition-all ${
                        coupon.is_active
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {coupon.is_active ? '⏸️ إيقاف' : '▶️ تفعيل'}
                    </button>
                    <button
                      onClick={() => deleteCoupon(coupon.id)}
                      className="flex-1 md:flex-none px-4 py-2 bg-red-100 text-red-700 rounded-lg font-bold hover:bg-red-200 transition-all"
                    >
                      🗑️ حذف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Create Coupon Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">✨ إنشاء كوبون خصم جديد</h2>

            <div className="space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  كود الكوبون
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="SUMMER2024"
                    className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                  <button
                    onClick={generateRandomCode}
                    className="px-4 py-3 bg-purple-100 text-purple-700 rounded-xl font-bold hover:bg-purple-200 transition-colors"
                  >
                    🎲 توليد
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  الوصف
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="خصم خاص للصيف"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Discount Type */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  نوع الخصم
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFormData({ ...formData, discount_type: 'percentage' })}
                    className={`p-4 rounded-xl font-bold transition-all ${
                      formData.discount_type === 'percentage'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    📊 نسبة مئوية %
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, discount_type: 'fixed' })}
                    className={`p-4 rounded-xl font-bold transition-all ${
                      formData.discount_type === 'fixed'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    💵 مبلغ ثابت
                  </button>
                </div>
              </div>

              {/* Discount Value */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  قيمة الخصم {formData.discount_type === 'percentage' ? '(%)' : '(دينار)'}
                </label>
                <input
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  placeholder={formData.discount_type === 'percentage' ? '20' : '50'}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Min Purchase */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    الحد الأدنى للشراء
                  </label>
                  <input
                    type="number"
                    value={formData.min_purchase}
                    onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })}
                    placeholder="100"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* Max Discount (للنسبة المئوية فقط) */}
                {formData.discount_type === 'percentage' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      الحد الأقصى للخصم
                    </label>
                    <input
                      type="number"
                      value={formData.max_discount}
                      onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                      placeholder="150"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Usage Limit */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    عدد الاستخدامات
                  </label>
                  <input
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    placeholder="100"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Start Date */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    تاريخ البدء
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    تاريخ الانتهاء
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-slate-200 text-slate-700 py-3 px-6 rounded-xl font-bold hover:bg-slate-300 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateCoupon}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-6 rounded-xl font-bold hover:shadow-lg transition-all"
              >
                ✨ إنشاء الكوبون
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Coupon Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">✏️ تعديل كوبون الخصم</h2>

            <div className="space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  كود الكوبون
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="SAVE20"
                    className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none font-bold"
                  />
                  <button
                    onClick={generateRandomCode}
                    className="px-4 py-3 bg-purple-100 text-purple-700 rounded-xl font-bold hover:bg-purple-200 transition-colors"
                  >
                    🎲 عشوائي
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  الوصف
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="خصم 20% على جميع المنتجات"
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Discount Type */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    نوع الخصم
                  </label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  >
                    <option value="percentage">نسبة مئوية</option>
                    <option value="fixed">مبلغ ثابت</option>
                  </select>
                </div>

                {/* Discount Value */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    قيمة الخصم
                  </label>
                  <input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    placeholder={formData.discount_type === 'percentage' ? '20' : '50'}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Min Purchase */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    الحد الأدنى للشراء (د.أ)
                  </label>
                  <input
                    type="number"
                    value={formData.min_purchase}
                    onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })}
                    placeholder="100"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* Max Discount */}
                {formData.discount_type === 'percentage' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      الحد الأقصى للخصم
                    </label>
                    <input
                      type="number"
                      value={formData.max_discount}
                      onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                      placeholder="150"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Usage Limit */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    عدد الاستخدامات
                  </label>
                  <input
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    placeholder="100"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Start Date */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    تاريخ البدء
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    تاريخ الانتهاء
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCoupon(null);
                }}
                className="flex-1 bg-slate-200 text-slate-700 py-3 px-6 rounded-xl font-bold hover:bg-slate-300 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleUpdateCoupon}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-xl font-bold hover:shadow-lg transition-all"
              >
                ✅ حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Floating Add Button */}
      <FloatingAddButton />
    </div>
  );
}

