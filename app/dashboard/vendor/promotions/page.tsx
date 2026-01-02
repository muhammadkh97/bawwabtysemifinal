'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import FloatingAddButton from '@/components/dashboard/FloatingAddButton';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Tag, Percent, Calendar, TrendingUp, Users, Plus, Edit, Trash2, 
  Gift, DollarSign, Clock, Target, Sparkles, Copy, Check, X, AlertCircle, Eye
} from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_purchase: number;
  max_discount?: number;
  usage_limit: number;
  used_count: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'scheduled';
}

export default function VendorPromotionsPage() {
  const [showNewCouponModal, setShowNewCouponModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { userId } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    min_purchase: 0,
    max_discount: 0,
    usage_limit: 1,
    start_date: '',
    end_date: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (userId) {
      fetchCoupons();
    }
  }, [userId]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      
      // Get vendor ID first
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!vendorData) return;

      // Fetch coupons
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('vendor_id', vendorData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data and calculate status
      const now = new Date();
      const transformedCoupons = (data || []).map(coupon => {
        const startDate = new Date(coupon.start_date);
        const endDate = new Date(coupon.end_date);
        
        let status: 'active' | 'expired' | 'scheduled' = 'active';
        if (now < startDate) status = 'scheduled';
        else if (now > endDate) status = 'expired';
        
        return {
          ...coupon,
          status,
        };
      });

      setCoupons(transformedCoupons);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'رمز الكوبون مطلوب';
    } else if (formData.code.length < 4) {
      newErrors.code = 'رمز الكوبون يجب أن يكون 4 أحرف على الأقل';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'وصف الكوبون مطلوب';
    }

    if (formData.value <= 0) {
      newErrors.value = 'قيمة الخصم يجب أن تكون أكبر من 0';
    }

    if (formData.type === 'percentage' && formData.value > 100) {
      newErrors.value = 'نسبة الخصم لا يمكن أن تكون أكبر من 100%';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'تاريخ البدء مطلوب';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'تاريخ الانتهاء مطلوب';
    }

    if (formData.start_date && formData.end_date && new Date(formData.start_date) >= new Date(formData.end_date)) {
      newErrors.end_date = 'تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      // Get vendor ID
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!vendorData) {
        alert('خطأ: لم يتم العثور على بيانات البائع');
        return;
      }

      // Insert new coupon
      const { error } = await supabase
        .from('coupons')
        .insert([{
          vendor_id: vendorData.id,
          name: formData.code.toUpperCase(), // استخدام الكود كاسم
          code: formData.code.toUpperCase(),
          description: formData.description,
          discount_type: formData.type,
          discount_value: formData.value,
          min_purchase: formData.min_purchase,
          max_discount: formData.type === 'percentage' ? formData.max_discount : null,
          usage_limit: formData.usage_limit,
          used_count: 0,
          start_date: formData.start_date,
          end_date: formData.end_date,
          is_active: true,
        }]);

      if (error) throw error;

      // Reset form and close modal
      setFormData({
        code: '',
        description: '',
        type: 'percentage',
        value: 0,
        min_purchase: 0,
        max_discount: 0,
        usage_limit: 1,
        start_date: '',
        end_date: '',
      });
      setShowNewCouponModal(false);
      
      // Refresh coupons list
      fetchCoupons();
      
      alert('✅ تم إنشاء الكوبون بنجاح!');
    } catch (error: any) {
      console.error('Error creating coupon:', error);
      alert('حدث خطأ أثناء إنشاء الكوبون: ' + (error.message || 'خطأ غير معروف'));
    } finally {
      setSaving(false);
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

      fetchCoupons();
      alert('✅ تم حذف الكوبون بنجاح!');
    } catch (error) {
      console.error('Error deleting coupon:', error);
      alert('حدث خطأ أثناء حذف الكوبون');
    }
  };

  const stats = [
    { label: 'إجمالي الكوبونات', value: coupons.length, color: '#8B5CF6', icon: Tag },
    { label: 'كوبونات نشطة', value: coupons.filter(c => c.status === 'active').length, color: '#10B981', icon: TrendingUp },
    { label: 'إجمالي الاستخدامات', value: coupons.reduce((acc, c) => acc + c.used_count, 0), color: '#F59E0B', icon: Users },
    { label: 'جاهز للاستخدام', value: coupons.filter(c => c.status === 'active').length, color: '#EC4899', icon: Target },
  ];

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { text: 'نشط', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
      expired: { text: 'منتهي', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
      scheduled: { text: 'مجدول', color: 'bg-orange-500/20 text-orange-400 border-orange-500/50' },
    };
    const badge = badges[status as keyof typeof badges];
    return (
      <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.round((used / limit) * 100);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-[#0A0515] transition-colors duration-300">
      <FuturisticSidebar role="vendor" />
      
      <div className="md:mr-[280px] transition-all duration-300">
        <FuturisticNavbar userName="بائع" userRole="بائع" />
        
        <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10 relative z-10 max-w-[1800px] mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Sparkles className="w-10 h-10 text-purple-400" />
                الترويج والكوبونات
              </h1>
              <p className="text-purple-300 text-lg">إدارة العروض والخصومات الخاصة بمتجرك</p>
            </div>
            <button
              onClick={() => setShowNewCouponModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #D946EF)' }}
            >
              <Plus className="w-5 h-5" />
              <span>إنشاء كوبون جديد</span>
            </button>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl p-6 transition-all hover:scale-105"
                style={{
                  background: 'rgba(15, 10, 30, 0.6)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ background: `${stat.color}20` }}
                  >
                    <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
                <p className="text-purple-300 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Coupons Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl p-6 mb-8"
            style={{
              background: 'rgba(15, 10, 30, 0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Gift className="w-6 h-6 text-purple-400" />
                الكوبونات المتاحة
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {coupons.map((coupon, index) => (
                <motion.div
                  key={coupon.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-2xl p-6 transition-all hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(217, 70, 239, 0.1))',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                  }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="px-4 py-2 rounded-lg font-mono text-lg font-bold text-white cursor-pointer hover:scale-105 transition-all flex items-center gap-2"
                          onClick={() => copyCode(coupon.code)}
                          style={{ background: 'rgba(139, 92, 246, 0.3)' }}
                        >
                          {coupon.code}
                          {copiedCode === coupon.code ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-purple-400" />
                          )}
                        </div>
                        {getStatusBadge(coupon.status)}
                      </div>
                      <p className="text-purple-300 text-sm">{coupon.description}</p>
                    </div>
                  </div>

                  {/* Discount Info */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Percent className="w-5 h-5 text-purple-400" />
                      <span className="text-2xl font-bold text-white">
                        {coupon.type === 'percentage' ? `${coupon.value}%` : `${coupon.value} ₪`}
                      </span>
                    </div>
                    <div className="text-sm text-purple-300">
                      {coupon.type === 'percentage' ? 'خصم نسبي' : 'خصم ثابت'}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-300">الحد الأدنى للشراء:</span>
                      <span className="font-bold text-white">{coupon.min_purchase} ₪</span>
                    </div>
                    {coupon.max_discount && (
                      <div className="flex justify-between text-sm">
                        <span className="text-purple-300">أقصى خصم:</span>
                        <span className="font-bold text-white">{coupon.max_discount} ₪</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-300 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        صالح حتى:
                      </span>
                      <span className="font-bold text-white">
                        {new Date(coupon.end_date).toLocaleDateString('ar')}
                      </span>
                    </div>
                  </div>

                  {/* Usage Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-purple-300">الاستخدام</span>
                      <span className="font-bold text-white">
                        {coupon.used_count} / {coupon.usage_limit}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${getUsagePercentage(coupon.used_count, coupon.usage_limit)}%`,
                          background: getUsagePercentage(coupon.used_count, coupon.usage_limit) > 80
                            ? 'linear-gradient(90deg, #EF4444, #DC2626)'
                            : 'linear-gradient(90deg, #8B5CF6, #D946EF)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      className="flex-1 px-4 py-2 rounded-xl text-white text-sm font-medium transition-all hover:scale-105 flex items-center justify-center gap-2"
                      style={{ background: 'rgba(139, 92, 246, 0.3)', border: '1px solid rgba(139, 92, 246, 0.5)' }}
                    >
                      <Edit className="w-4 h-4" />
                      تعديل
                    </button>
                    <button
                      onClick={() => deleteCoupon(coupon.id)}
                      className="px-4 py-2 rounded-xl text-red-400 text-sm font-medium transition-all hover:scale-105 hover:bg-red-500/30"
                      style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)' }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {coupons.length === 0 && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🎟️</div>
                <h3 className="text-2xl font-bold text-white mb-2">لا توجد كوبونات حتى الآن</h3>
                <p className="text-purple-300 mb-6">أنشئ أول كوبون خصم لجذب المزيد من العملاء</p>
                <button
                  onClick={() => setShowNewCouponModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6, #D946EF)' }}
                >
                  <Plus className="w-5 h-5" />
                  <span>إنشاء كوبون الآن</span>
                </button>
              </div>
            )}
          </motion.div>

          {/* Marketing Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="rounded-2xl p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(217, 70, 239, 0.2))',
              border: '1px solid rgba(139, 92, 246, 0.3)',
            }}
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              نصائح تسويقية
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl" style={{ background: 'rgba(15, 10, 30, 0.6)' }}>
                <DollarSign className="w-8 h-8 text-green-400 mb-2" />
                <h4 className="font-bold text-white mb-1">خصومات الولاء</h4>
                <p className="text-sm text-purple-300">كافئ عملاءك المخلصين بخصومات حصرية</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: 'rgba(15, 10, 30, 0.6)' }}>
                <Clock className="w-8 h-8 text-orange-400 mb-2" />
                <h4 className="font-bold text-white mb-1">عروض محدودة</h4>
                <p className="text-sm text-purple-300">أنشئ حالة من الإلحاح لزيادة المبيعات</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: 'rgba(15, 10, 30, 0.6)' }}>
                <Users className="w-8 h-8 text-blue-400 mb-2" />
                <h4 className="font-bold text-white mb-1">توصيات العملاء</h4>
                <p className="text-sm text-purple-300">شجع العملاء على مشاركة كوبوناتهم</p>
              </div>
            </div>
          </motion.div>
        </main>
      </div>

      {/* Create Coupon Modal */}
      {showNewCouponModal && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowNewCouponModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="rounded-3xl p-8 max-w-4xl w-full my-8"
            style={{ 
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(217, 70, 239, 0.15))',
              backdropFilter: 'blur(20px)',
              border: '2px solid rgba(139, 92, 246, 0.5)',
              boxShadow: '0 0 60px rgba(139, 92, 246, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #8B5CF6, #D946EF)' }}>
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">إنشاء كوبون جديد</h2>
                  <p className="text-purple-300 text-sm">أضف عرض خصم مميز لجذب المزيد من العملاء</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewCouponModal(false)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-purple-300 hover:text-white transition-colors"
                style={{ background: 'rgba(139, 92, 246, 0.2)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-6">
              {/* Coupon Code */}
              <div>
                <label className="block text-white font-semibold mb-2">رمز الكوبون *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="مثال: SALE2025"
                    maxLength={20}
                    className="flex-1 px-4 py-3 rounded-xl text-white placeholder-purple-400 outline-none"
                    style={{ background: 'rgba(15, 10, 30, 0.8)', border: errors.code ? '2px solid #EF4444' : '2px solid rgba(139, 92, 246, 0.3)' }}
                  />
                  <button
                    onClick={generateCouponCode}
                    className="px-6 py-3 rounded-xl text-white font-semibold transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, #8B5CF6, #D946EF)' }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </button>
                </div>
                {errors.code && <p className="text-red-400 text-sm mt-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.code}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-white font-semibold mb-2">وصف الكوبون *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="مثال: خصم خاص للعملاء الجدد"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-purple-400 outline-none resize-none"
                  style={{ background: 'rgba(15, 10, 30, 0.8)', border: errors.description ? '2px solid #EF4444' : '2px solid rgba(139, 92, 246, 0.3)' }}
                />
                {errors.description && <p className="text-red-400 text-sm mt-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.description}</p>}
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-semibold mb-2">نوع الخصم *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full px-4 py-3 rounded-xl text-white outline-none cursor-pointer"
                    style={{ background: 'rgba(15, 10, 30, 0.8)', border: '2px solid rgba(139, 92, 246, 0.3)' }}
                  >
                    <option value="percentage">نسبة مئوية %</option>
                    <option value="fixed">مبلغ ثابت</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">
                    قيمة الخصم * {formData.type === 'percentage' ? '(%)' : '(ر.س)'}
                  </label>
                  <input
                    type="number"
                    value={formData.value || ''}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                    placeholder={formData.type === 'percentage' ? '10' : '50'}
                    min="0"
                    max={formData.type === 'percentage' ? 100 : undefined}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-purple-400 outline-none"
                    style={{ background: 'rgba(15, 10, 30, 0.8)', border: errors.value ? '2px solid #EF4444' : '2px solid rgba(139, 92, 246, 0.3)' }}
                  />
                  {errors.value && <p className="text-red-400 text-sm mt-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.value}</p>}
                </div>
              </div>

              {/* Min Purchase & Max Discount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-semibold mb-2">الحد الأدنى للشراء (ر.س)</label>
                  <input
                    type="number"
                    value={formData.min_purchase || ''}
                    onChange={(e) => setFormData({ ...formData, min_purchase: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-purple-400 outline-none"
                    style={{ background: 'rgba(15, 10, 30, 0.8)', border: '2px solid rgba(139, 92, 246, 0.3)' }}
                  />
                  <p className="text-purple-300 text-xs mt-1">الحد الأدنى لسعر الطلب لاستخدام الكوبون</p>
                </div>

                {formData.type === 'percentage' && (
                  <div>
                    <label className="block text-white font-semibold mb-2">الحد الأقصى للخصم (ر.س)</label>
                    <input
                      type="number"
                      value={formData.max_discount || ''}
                      onChange={(e) => setFormData({ ...formData, max_discount: parseFloat(e.target.value) || 0 })}
                      placeholder="0 (غير محدود)"
                      min="0"
                      className="w-full px-4 py-3 rounded-xl text-white placeholder-purple-400 outline-none"
                      style={{ background: 'rgba(15, 10, 30, 0.8)', border: '2px solid rgba(139, 92, 246, 0.3)' }}
                    />
                    <p className="text-purple-300 text-xs mt-1">الحد الأقصى لقيمة الخصم بالريال</p>
                  </div>
                )}
              </div>

              {/* Usage Limit */}
              <div>
                <label className="block text-white font-semibold mb-2">حد الاستخدام</label>
                <input
                  type="number"
                  value={formData.usage_limit || ''}
                  onChange={(e) => setFormData({ ...formData, usage_limit: parseInt(e.target.value) || 1 })}
                  placeholder="1"
                  min="1"
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-purple-400 outline-none"
                  style={{ background: 'rgba(15, 10, 30, 0.8)', border: '2px solid rgba(139, 92, 246, 0.3)' }}
                />
                <p className="text-purple-300 text-xs mt-1">عدد المرات التي يمكن استخدام الكوبون فيها</p>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-semibold mb-2">تاريخ البدء *</label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white outline-none"
                    style={{ background: 'rgba(15, 10, 30, 0.8)', border: errors.start_date ? '2px solid #EF4444' : '2px solid rgba(139, 92, 246, 0.3)' }}
                  />
                  {errors.start_date && <p className="text-red-400 text-sm mt-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.start_date}</p>}
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">تاريخ الانتهاء *</label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white outline-none"
                    style={{ background: 'rgba(15, 10, 30, 0.8)', border: errors.end_date ? '2px solid #EF4444' : '2px solid rgba(139, 92, 246, 0.3)' }}
                  />
                  {errors.end_date && <p className="text-red-400 text-sm mt-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.end_date}</p>}
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-2xl p-6"
                style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))', border: '1px solid rgba(16, 185, 129, 0.3)' }}
              >
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-green-400" />
                  معاينة الكوبون
                </h3>
                <div className="bg-white/5 rounded-xl p-4 border border-green-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-white">{formData.code || 'COUPON'}</span>
                    <span className="px-3 py-1 rounded-lg text-sm font-bold"
                      style={{ background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white' }}
                    >
                      {formData.type === 'percentage' ? `${formData.value}%` : `${formData.value} ر.س`} خصم
                    </span>
                  </div>
                  <p className="text-purple-200 text-sm">{formData.description || 'وصف الكوبون'}</p>
                  {formData.min_purchase > 0 && (
                    <p className="text-purple-300 text-xs mt-2">الحد الأدنى: {formData.min_purchase} ر.س</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 py-4 rounded-xl text-white font-bold text-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 0 30px rgba(16, 185, 129, 0.5)' }}
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      إنشاء الكوبون
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowNewCouponModal(false)}
                  disabled={saving}
                  className="px-8 py-4 rounded-xl text-white font-bold transition-all hover:scale-105 disabled:opacity-50"
                  style={{ background: 'rgba(239, 68, 68, 0.2)', border: '2px solid rgba(239, 68, 68, 0.5)' }}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
