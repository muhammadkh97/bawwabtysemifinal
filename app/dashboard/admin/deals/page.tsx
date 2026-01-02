'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import { Zap, Plus, Edit2, Trash2, Clock, Percent, Package, Calendar, X, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface Deal {
  id: string;
  title: string;
  title_ar: string;
  discount_percentage: number;
  icon: string;
  gradient: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  product_count?: number;
  created_at: string;
}

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    title_ar: '',
    discount_percentage: 0,
    icon: '🎉',
    gradient: 'from-red-500 to-orange-500',
    start_date: '',
    end_date: '',
    is_active: true,
  });

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeals(data || []);
    } catch (error) {
      console.error('Error fetching deals:', error);
      toast.error('فشل تحميل العروض');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingDeal) {
        // Update existing deal
        const { error } = await supabase
          .from('deals')
          .update(formData)
          .eq('id', editingDeal.id);

        if (error) throw error;
        toast.success('تم تحديث العرض بنجاح');
      } else {
        // Create new deal
        const { error } = await supabase
          .from('deals')
          .insert([formData]);

        if (error) throw error;
        toast.success('تم إضافة العرض بنجاح');
      }

      setShowModal(false);
      setEditingDeal(null);
      resetForm();
      fetchDeals();
    } catch (error: any) {
      console.error('Error saving deal:', error);
      toast.error(error.message || 'حدث خطأ أثناء حفظ العرض');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العرض؟')) return;

    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('تم حذف العرض بنجاح');
      fetchDeals();
    } catch (error: any) {
      console.error('Error deleting deal:', error);
      toast.error('فشل حذف العرض');
    }
  };

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setFormData({
      title: deal.title,
      title_ar: deal.title_ar,
      discount_percentage: deal.discount_percentage,
      icon: deal.icon,
      gradient: deal.gradient,
      start_date: deal.start_date.split('T')[0],
      end_date: deal.end_date.split('T')[0],
      is_active: deal.is_active,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      title_ar: '',
      discount_percentage: 0,
      icon: '🎉',
      gradient: 'from-red-500 to-orange-500',
      start_date: '',
      end_date: '',
      is_active: true,
    });
  };

  const handleOpenModal = () => {
    setEditingDeal(null);
    resetForm();
    setShowModal(true);
  };

  const gradientOptions = [
    { name: 'أحمر-برتقالي', value: 'from-red-500 to-orange-500' },
    { name: 'أزرق-سماوي', value: 'from-blue-500 to-cyan-500' },
    { name: 'وردي-بنفسجي', value: 'from-pink-500 to-purple-500' },
    { name: 'أخضر-زمردي', value: 'from-green-500 to-emerald-500' },
    { name: 'بنفسجي-وردي', value: 'from-purple-600 to-pink-500' },
    { name: 'أصفر-برتقالي', value: 'from-yellow-500 to-orange-500' },
  ];

  const iconOptions = ['🎉', '📱', '👗', '🏠', '⚡', '🔥', '💎', '🎁', '⭐', '🚀'];

  const getTimeRemaining = (endDate: string) => {
    const now = new Date().getTime();
    const end = new Date(endDate).getTime();
    const diff = end - now;

    if (diff <= 0) return 'منتهي';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} يوم`;
    return `${hours} ساعة`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0515] transition-colors duration-300">
      <FuturisticSidebar role="admin" />
      
      <div className="mr-64">
        <FuturisticNavbar />
        
        <main className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Zap className="w-10 h-10 text-yellow-400" />
                إدارة العروض اليومية
              </h1>
              <p className="text-purple-300">إنشاء وإدارة العروض والخصومات الخاصة</p>
            </div>
            <button
              onClick={handleOpenModal}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg"
            >
              <Plus className="w-5 h-5" />
              إضافة عرض جديد
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
            </div>
          )}

          {/* Deals Grid */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {deals.map((deal) => (
                  <motion.div
                    key={deal.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="rounded-3xl overflow-hidden"
                    style={{
                      background: 'rgba(15, 10, 30, 0.6)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(98, 54, 255, 0.3)'
                    }}
                  >
                    <div className={`h-32 bg-gradient-to-r ${deal.gradient} flex items-center justify-center text-6xl`}>
                      {deal.icon}
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">{deal.title_ar}</h3>
                          <p className="text-sm text-purple-300">{deal.title}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                          deal.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {deal.is_active ? 'نشط' : 'غير نشط'}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Percent className="w-4 h-4 text-yellow-400" />
                          <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                            {deal.discount_percentage}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-purple-300">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">{getTimeRemaining(deal.end_date)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-purple-300 mb-6">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(deal.start_date).toLocaleDateString('ar-SA')} - {new Date(deal.end_date).toLocaleDateString('ar-SA')}</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(deal)}
                          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition flex items-center justify-center gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          تعديل
                        </button>
                        <button
                          onClick={() => handleDelete(deal.id)}
                          className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl font-medium hover:bg-red-500/30 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {deals.length === 0 && !loading && (
                <div className="col-span-full text-center py-20">
                  <AlertCircle className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">لا توجد عروض حالياً</h3>
                  <p className="text-purple-300 mb-6">ابدأ بإضافة عرض جديد</p>
                  <button
                    onClick={handleOpenModal}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-2xl font-bold inline-flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    إضافة عرض
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0F0A1E] rounded-3xl p-8 max-w-2xl w-full border border-purple-500/30 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingDeal ? 'تعديل العرض' : 'إضافة عرض جديد'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-purple-300 hover:text-white transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-purple-300 mb-2 text-sm font-medium">العنوان بالعربية</label>
                    <input
                      type="text"
                      value={formData.title_ar}
                      onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                      placeholder="عرض الجمعة البيضاء"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-300 mb-2 text-sm font-medium">العنوان بالإنجليزية</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                      placeholder="Black Friday Deal"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-purple-300 mb-2 text-sm font-medium">نسبة الخصم (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: Number(e.target.value) })}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-purple-300 mb-2 text-sm font-medium">الأيقونة</label>
                  <div className="grid grid-cols-5 gap-2">
                    {iconOptions.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`text-4xl p-3 rounded-xl border-2 transition ${
                          formData.icon === icon
                            ? 'border-purple-500 bg-purple-500/20'
                            : 'border-purple-500/30 hover:border-purple-500/50'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-purple-300 mb-2 text-sm font-medium">التدرج اللوني</label>
                  <div className="grid grid-cols-2 gap-2">
                    {gradientOptions.map((gradient) => (
                      <button
                        key={gradient.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, gradient: gradient.value })}
                        className={`p-4 rounded-xl border-2 transition ${
                          formData.gradient === gradient.value
                            ? 'border-purple-500'
                            : 'border-purple-500/30 hover:border-purple-500/50'
                        }`}
                      >
                        <div className={`h-8 rounded-lg bg-gradient-to-r ${gradient.value} mb-2`}></div>
                        <span className="text-xs text-white">{gradient.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-purple-300 mb-2 text-sm font-medium">تاريخ البدء</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-300 mb-2 text-sm font-medium">تاريخ الانتهاء</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-5 h-5 rounded border-purple-500/30 bg-white/5"
                  />
                  <label htmlFor="is_active" className="text-purple-300 cursor-pointer">تفعيل العرض</label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:scale-105 transition-transform"
                  >
                    {editingDeal ? 'تحديث العرض' : 'إضافة العرض'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 bg-white/5 text-purple-300 rounded-xl font-bold hover:bg-white/10 transition"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
