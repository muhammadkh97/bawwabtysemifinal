'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import { Gift, Plus, Edit2, Trash2, Users, Trophy, Settings, X, Save, Eye, TrendingUp, Star, Crown, Award, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface LuckyBox {
  id: string;
  title: string;
  title_ar: string;
  description: string;
  icon: string;
  gradient: string;
  total_points: number;
  max_winners: number;
  min_points: number;
  max_points: number;
  current_winners: number;
  is_active: boolean;
  start_date: string;
  end_date: string;
}

interface LoyaltyTier {
  id: string;
  tier_name: string;
  tier_name_ar: string;
  min_points: number;
  max_points: number | null;
  icon: string;
  color: string;
  bg_pattern: string;
  discount_percentage: number;
  free_shipping_threshold: number;
  priority_support: boolean;
  exclusive_deals: boolean;
  birthday_bonus: number;
  tier_order: number;
  is_active: boolean;
}

export default function AdminLuckyBoxesPage() {
  const [activeTab, setActiveTab] = useState<'boxes' | 'tiers'>('boxes');
  const [loading, setLoading] = useState(true);
  const [luckyBoxes, setLuckyBoxes] = useState<LuckyBox[]>([]);
  const [loyaltyTiers, setLoyaltyTiers] = useState<LoyaltyTier[]>([]);
  const [showBoxModal, setShowBoxModal] = useState(false);
  const [showTierModal, setShowTierModal] = useState(false);
  const [editingBox, setEditingBox] = useState<LuckyBox | null>(null);
  const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null);

  const [boxForm, setBoxForm] = useState({
    title: '',
    title_ar: '',
    description: '',
    icon: '🎁',
    gradient: 'from-yellow-400 via-orange-500 to-red-500',
    total_points: 10000,
    max_winners: 50,
    min_points: 50,
    max_points: 500,
    start_date: '',
    end_date: '',
    is_active: true,
  });

  const [tierForm, setTierForm] = useState({
    tier_name: '',
    tier_name_ar: '',
    min_points: 0,
    max_points: null as number | null,
    icon: 'Gift',
    color: 'from-gray-400 to-gray-600',
    bg_pattern: 'bg-gradient-to-br from-gray-500/20 to-gray-300/20',
    discount_percentage: 0,
    free_shipping_threshold: 0,
    priority_support: false,
    exclusive_deals: false,
    birthday_bonus: 0,
    tier_order: 1,
    is_active: true,
  });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'boxes') {
        await fetchLuckyBoxes();
      } else {
        await fetchLoyaltyTiers();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLuckyBoxes = async () => {
    const { data, error } = await supabase
      .from('lucky_boxes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching lucky boxes:', error);
      return;
    }

    setLuckyBoxes(data || []);
  };

  const fetchLoyaltyTiers = async () => {
    const { data, error } = await supabase
      .from('loyalty_tiers')
      .select('*')
      .order('tier_order', { ascending: true });

    if (error) {
      console.error('Error fetching loyalty tiers:', error);
      return;
    }

    setLoyaltyTiers(data || []);
  };

  const handleSaveBox = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingBox) {
        const { error } = await supabase
          .from('lucky_boxes')
          .update(boxForm)
          .eq('id', editingBox.id);

        if (error) throw error;
        toast.success('تم تحديث صندوق الحظ بنجاح');
      } else {
        const { error } = await supabase
          .from('lucky_boxes')
          .insert([boxForm]);

        if (error) throw error;
        toast.success('تم إضافة صندوق الحظ بنجاح');
      }

      setShowBoxModal(false);
      setEditingBox(null);
      resetBoxForm();
      fetchLuckyBoxes();
    } catch (error: any) {
      console.error('Error saving lucky box:', error);
      toast.error(error.message || 'حدث خطأ أثناء حفظ صندوق الحظ');
    }
  };

  const handleSaveTier = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTier) {
        const { error } = await supabase
          .from('loyalty_tiers')
          .update(tierForm)
          .eq('id', editingTier.id);

        if (error) throw error;
        toast.success('تم تحديث المستوى بنجاح');
      } else {
        const { error } = await supabase
          .from('loyalty_tiers')
          .insert([tierForm]);

        if (error) throw error;
        toast.success('تم إضافة المستوى بنجاح');
      }

      setShowTierModal(false);
      setEditingTier(null);
      resetTierForm();
      fetchLoyaltyTiers();
    } catch (error: any) {
      console.error('Error saving tier:', error);
      toast.error(error.message || 'حدث خطأ أثناء حفظ المستوى');
    }
  };

  const handleDeleteBox = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الصندوق؟')) return;

    try {
      const { error } = await supabase
        .from('lucky_boxes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('تم حذف الصندوق بنجاح');
      fetchLuckyBoxes();
    } catch (error: any) {
      console.error('Error deleting box:', error);
      toast.error('فشل حذف الصندوق');
    }
  };

  const handleDeleteTier = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستوى؟')) return;

    try {
      const { error } = await supabase
        .from('loyalty_tiers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('تم حذف المستوى بنجاح');
      fetchLoyaltyTiers();
    } catch (error: any) {
      console.error('Error deleting tier:', error);
      toast.error('فشل حذف المستوى');
    }
  };

  const handleEditBox = (box: LuckyBox) => {
    setEditingBox(box);
    setBoxForm({
      title: box.title,
      title_ar: box.title_ar,
      description: box.description,
      icon: box.icon,
      gradient: box.gradient,
      total_points: box.total_points,
      max_winners: box.max_winners,
      min_points: box.min_points,
      max_points: box.max_points,
      start_date: box.start_date.split('T')[0],
      end_date: box.end_date.split('T')[0],
      is_active: box.is_active,
    });
    setShowBoxModal(true);
  };

  const handleEditTier = (tier: LoyaltyTier) => {
    setEditingTier(tier);
    setTierForm({
      tier_name: tier.tier_name,
      tier_name_ar: tier.tier_name_ar,
      min_points: tier.min_points,
      max_points: tier.max_points,
      icon: tier.icon,
      color: tier.color,
      bg_pattern: tier.bg_pattern,
      discount_percentage: tier.discount_percentage,
      free_shipping_threshold: tier.free_shipping_threshold,
      priority_support: tier.priority_support,
      exclusive_deals: tier.exclusive_deals,
      birthday_bonus: tier.birthday_bonus,
      tier_order: tier.tier_order,
      is_active: tier.is_active,
    });
    setShowTierModal(true);
  };

  const resetBoxForm = () => {
    setBoxForm({
      title: '',
      title_ar: '',
      description: '',
      icon: '🎁',
      gradient: 'from-yellow-400 via-orange-500 to-red-500',
      total_points: 10000,
      max_winners: 50,
      min_points: 50,
      max_points: 500,
      start_date: '',
      end_date: '',
      is_active: true,
    });
  };

  const resetTierForm = () => {
    setTierForm({
      tier_name: '',
      tier_name_ar: '',
      min_points: 0,
      max_points: null,
      icon: 'Gift',
      color: 'from-gray-400 to-gray-600',
      bg_pattern: 'bg-gradient-to-br from-gray-500/20 to-gray-300/20',
      discount_percentage: 0,
      free_shipping_threshold: 0,
      priority_support: false,
      exclusive_deals: false,
      birthday_bonus: 0,
      tier_order: 1,
      is_active: true,
    });
  };

  const iconOptions = ['🎁', '🎉', '💎', '⭐', '🎊', '🎈', '🏆', '👑', '💰', '🎯'];
  const gradientOptions = [
    { name: 'ذهبي', value: 'from-yellow-400 via-orange-500 to-red-500' },
    { name: 'أزرق', value: 'from-blue-500 to-cyan-500' },
    { name: 'وردي', value: 'from-pink-500 to-purple-500' },
    { name: 'أخضر', value: 'from-green-500 to-emerald-500' },
    { name: 'بنفسجي', value: 'from-purple-600 to-pink-500' },
    { name: 'قوس قزح', value: 'from-red-500 via-yellow-500 to-green-500' },
  ];

  const lucideIcons = ['Gift', 'Star', 'Award', 'Crown', 'Trophy', 'Sparkles'];

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
                <Gift className="w-10 h-10 text-yellow-400" />
                صناديق الحظ و مستويات الولاء
              </h1>
              <p className="text-purple-300">إدارة صناديق الحظ ومستويات العضوية</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setActiveTab('boxes')}
              className={`px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all ${
                activeTab === 'boxes'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg scale-105'
                  : 'bg-white/5 text-purple-300 hover:bg-white/10'
              }`}
            >
              <Gift className="w-5 h-5" />
              صناديق الحظ
            </button>
            <button
              onClick={() => setActiveTab('tiers')}
              className={`px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all ${
                activeTab === 'tiers'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg scale-105'
                  : 'bg-white/5 text-purple-300 hover:bg-white/10'
              }`}
            >
              <Trophy className="w-5 h-5" />
              مستويات الولاء
            </button>
          </div>

          {/* Lucky Boxes Tab */}
          {activeTab === 'boxes' && (
            <div>
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => {
                    setEditingBox(null);
                    resetBoxForm();
                    setShowBoxModal(true);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                >
                  <Plus className="w-5 h-5" />
                  إضافة صندوق حظ
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {luckyBoxes.map((box) => (
                  <motion.div
                    key={box.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-3xl overflow-hidden"
                    style={{
                      background: 'rgba(15, 10, 30, 0.6)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(98, 54, 255, 0.3)'
                    }}
                  >
                    <div className={`h-32 bg-gradient-to-r ${box.gradient} flex items-center justify-center text-6xl`}>
                      {box.icon}
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">{box.title_ar}</h3>
                          <p className="text-sm text-purple-300">{box.title}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                          box.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {box.is_active ? 'نشط' : 'غير نشط'}
                        </div>
                      </div>

                      <p className="text-purple-300 text-sm mb-4">{box.description}</p>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-purple-300">النقاط الكلية:</span>
                          <span className="text-yellow-400 font-bold">{box.total_points.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-purple-300">نطاق النقاط:</span>
                          <span className="text-white font-bold">{box.min_points} - {box.max_points}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-purple-300">الفائزون:</span>
                          <span className="text-white font-bold">{box.current_winners} / {box.max_winners}</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full transition-all"
                            style={{ width: `${(box.current_winners / box.max_winners) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditBox(box)}
                          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition flex items-center justify-center gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          تعديل
                        </button>
                        <button
                          onClick={() => handleDeleteBox(box.id)}
                          className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl font-medium hover:bg-red-500/30 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Loyalty Tiers Tab */}
          {activeTab === 'tiers' && (
            <div>
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => {
                    setEditingTier(null);
                    resetTierForm();
                    setShowTierModal(true);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                >
                  <Plus className="w-5 h-5" />
                  إضافة مستوى
                </button>
              </div>

              <div className="space-y-6">
                {loyaltyTiers.map((tier) => (
                  <motion.div
                    key={tier.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-3xl p-6"
                    style={{
                      background: `linear-gradient(135deg, ${tier.color.replace('from-', 'rgba(').replace(' to-', ', 0.2), rgba(').replace(' via-', ', 0.2), rgba(')}), rgba(15, 10, 30, 0.6))`,
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(98, 54, 255, 0.3)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${tier.color} flex items-center justify-center`}>
                          {tier.icon === 'Gift' && <Gift className="w-8 h-8 text-white" />}
                          {tier.icon === 'Star' && <Star className="w-8 h-8 text-white" />}
                          {tier.icon === 'Award' && <Award className="w-8 h-8 text-white" />}
                          {tier.icon === 'Crown' && <Crown className="w-8 h-8 text-white" />}
                          {tier.icon === 'Trophy' && <Trophy className="w-8 h-8 text-white" />}
                          {tier.icon === 'Sparkles' && <Sparkles className="w-8 h-8 text-white" />}
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-white">{tier.tier_name_ar}</h3>
                          <p className="text-purple-300">{tier.min_points.toLocaleString()} - {tier.max_points ? tier.max_points.toLocaleString() : '∞'} نقطة</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                          tier.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {tier.is_active ? 'نشط' : 'غير نشط'}
                        </div>
                        <button
                          onClick={() => handleEditTier(tier)}
                          className="px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTier(tier.id)}
                          className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl font-medium hover:bg-red-500/30 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white/5 rounded-2xl p-4">
                        <div className="text-purple-300 text-sm mb-1">الخصم</div>
                        <div className="text-2xl font-bold text-white">{tier.discount_percentage}%</div>
                      </div>
                      <div className="bg-white/5 rounded-2xl p-4">
                        <div className="text-purple-300 text-sm mb-1">شحن مجاني فوق</div>
                        <div className="text-2xl font-bold text-white">{tier.free_shipping_threshold === 0 ? 'دائماً' : tier.free_shipping_threshold}</div>
                      </div>
                      <div className="bg-white/5 rounded-2xl p-4">
                        <div className="text-purple-300 text-sm mb-1">مكافأة عيد الميلاد</div>
                        <div className="text-2xl font-bold text-white">{tier.birthday_bonus}</div>
                      </div>
                      <div className="bg-white/5 rounded-2xl p-4">
                        <div className="text-purple-300 text-sm mb-1">المزايا الخاصة</div>
                        <div className="flex gap-2 mt-2">
                          {tier.priority_support && <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">دعم VIP</span>}
                          {tier.exclusive_deals && <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">عروض حصرية</span>}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Lucky Box Modal */}
      <AnimatePresence>
        {showBoxModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowBoxModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0F0A1E] rounded-3xl p-8 max-w-3xl w-full border border-purple-500/30 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingBox ? 'تعديل صندوق الحظ' : 'إضافة صندوق حظ جديد'}
                </h2>
                <button
                  onClick={() => setShowBoxModal(false)}
                  className="text-purple-300 hover:text-white transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveBox} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-purple-300 mb-2 text-sm font-medium">العنوان بالعربية</label>
                    <input
                      type="text"
                      value={boxForm.title_ar}
                      onChange={(e) => setBoxForm({ ...boxForm, title_ar: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-300 mb-2 text-sm font-medium">العنوان بالإنجليزية</label>
                    <input
                      type="text"
                      value={boxForm.title}
                      onChange={(e) => setBoxForm({ ...boxForm, title: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-purple-300 mb-2 text-sm font-medium">الوصف</label>
                  <textarea
                    value={boxForm.description}
                    onChange={(e) => setBoxForm({ ...boxForm, description: e.target.value })}
                    rows={3}
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
                        onClick={() => setBoxForm({ ...boxForm, icon })}
                        className={`text-4xl p-3 rounded-xl border-2 transition ${
                          boxForm.icon === icon
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
                  <div className="grid grid-cols-3 gap-2">
                    {gradientOptions.map((gradient) => (
                      <button
                        key={gradient.value}
                        type="button"
                        onClick={() => setBoxForm({ ...boxForm, gradient: gradient.value })}
                        className={`p-4 rounded-xl border-2 transition ${
                          boxForm.gradient === gradient.value
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
                    <label className="block text-purple-300 mb-2 text-sm font-medium">إجمالي النقاط</label>
                    <input
                      type="number"
                      value={boxForm.total_points}
                      onChange={(e) => setBoxForm({ ...boxForm, total_points: Number(e.target.value) })}
                      required
                      min="1"
                      className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-300 mb-2 text-sm font-medium">الحد الأقصى للفائزين</label>
                    <input
                      type="number"
                      value={boxForm.max_winners}
                      onChange={(e) => setBoxForm({ ...boxForm, max_winners: Number(e.target.value) })}
                      required
                      min="1"
                      className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-300 mb-2 text-sm font-medium">الحد الأدنى للنقاط</label>
                    <input
                      type="number"
                      value={boxForm.min_points}
                      onChange={(e) => setBoxForm({ ...boxForm, min_points: Number(e.target.value) })}
                      required
                      min="1"
                      className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-300 mb-2 text-sm font-medium">الحد الأقصى للنقاط</label>
                    <input
                      type="number"
                      value={boxForm.max_points}
                      onChange={(e) => setBoxForm({ ...boxForm, max_points: Number(e.target.value) })}
                      required
                      min="1"
                      className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-300 mb-2 text-sm font-medium">تاريخ البدء</label>
                    <input
                      type="date"
                      value={boxForm.start_date}
                      onChange={(e) => setBoxForm({ ...boxForm, start_date: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-300 mb-2 text-sm font-medium">تاريخ الانتهاء</label>
                    <input
                      type="date"
                      value={boxForm.end_date}
                      onChange={(e) => setBoxForm({ ...boxForm, end_date: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={boxForm.is_active}
                    onChange={(e) => setBoxForm({ ...boxForm, is_active: e.target.checked })}
                    className="w-5 h-5 rounded border-purple-500/30 bg-white/5"
                  />
                  <label className="text-purple-300 cursor-pointer">تفعيل الصندوق</label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {editingBox ? 'تحديث' : 'إضافة'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBoxModal(false)}
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

      {/* Tier Modal */}
      <AnimatePresence>
        {showTierModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowTierModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0F0A1E] rounded-3xl p-8 max-w-4xl w-full border border-purple-500/30 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingTier ? 'تعديل مستوى الولاء' : 'إضافة مستوى ولاء جديد'}
                </h2>
                <button
                  onClick={() => setShowTierModal(false)}
                  className="text-purple-300 hover:text-white transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSaveTier} className="space-y-6">
                {/* الأسماء */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-purple-300 mb-2 text-sm font-medium">اسم المستوى بالعربية</label>
                    <input
                      type="text"
                      value={tierForm.tier_name_ar}
                      onChange={(e) => setTierForm({ ...tierForm, tier_name_ar: e.target.value })}
                      required
                      placeholder="مثال: برونزي"
                      className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-300 mb-2 text-sm font-medium">اسم المستوى بالإنجليزية</label>
                    <input
                      type="text"
                      value={tierForm.tier_name}
                      onChange={(e) => setTierForm({ ...tierForm, tier_name: e.target.value })}
                      required
                      placeholder="Example: Bronze"
                      className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* نطاق النقاط */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-purple-300 mb-2 text-sm font-medium">الحد الأدنى للنقاط</label>
                    <input
                      type="number"
                      value={tierForm.min_points}
                      onChange={(e) => setTierForm({ ...tierForm, min_points: Number(e.target.value) })}
                      required
                      min="0"
                      className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-purple-300 mb-2 text-sm font-medium">الحد الأقصى للنقاط (اتركه فارغاً للنهاية المفتوحة)</label>
                    <input
                      type="number"
                      value={tierForm.max_points || ''}
                      onChange={(e) => setTierForm({ ...tierForm, max_points: e.target.value ? Number(e.target.value) : null })}
                      min="0"
                      placeholder="∞ (غير محدود)"
                      className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* الأيقونة */}
                <div>
                  <label className="block text-purple-300 mb-2 text-sm font-medium">الأيقونة</label>
                  <div className="grid grid-cols-6 gap-3">
                    {lucideIcons.map((iconName) => (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setTierForm({ ...tierForm, icon: iconName })}
                        className={`p-4 rounded-xl border-2 transition flex items-center justify-center ${
                          tierForm.icon === iconName
                            ? 'border-purple-500 bg-purple-500/20'
                            : 'border-purple-500/30 hover:border-purple-500/50'
                        }`}
                      >
                        {iconName === 'Gift' && <Gift className="w-6 h-6 text-white" />}
                        {iconName === 'Star' && <Star className="w-6 h-6 text-white" />}
                        {iconName === 'Award' && <Award className="w-6 h-6 text-white" />}
                        {iconName === 'Crown' && <Crown className="w-6 h-6 text-white" />}
                        {iconName === 'Trophy' && <Trophy className="w-6 h-6 text-white" />}
                        {iconName === 'Sparkles' && <Sparkles className="w-6 h-6 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* اللون */}
                <div>
                  <label className="block text-purple-300 mb-2 text-sm font-medium">التدرج اللوني</label>
                  <div className="grid grid-cols-3 gap-3">
                    {gradientOptions.map((gradient) => (
                      <button
                        key={gradient.value}
                        type="button"
                        onClick={() => setTierForm({ ...tierForm, color: gradient.value })}
                        className={`p-3 rounded-xl border-2 transition ${
                          tierForm.color === gradient.value
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

                {/* المزايا */}
                <div className="bg-white/5 rounded-2xl p-6 space-y-4">
                  <h3 className="text-lg font-bold text-white mb-4">مزايا المستوى</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-purple-300 mb-2 text-sm font-medium">نسبة الخصم (%)</label>
                      <input
                        type="number"
                        value={tierForm.discount_percentage}
                        onChange={(e) => setTierForm({ ...tierForm, discount_percentage: Number(e.target.value) })}
                        min="0"
                        max="100"
                        step="0.1"
                        className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-purple-300 mb-2 text-sm font-medium">حد الشحن المجاني (ريال)</label>
                      <input
                        type="number"
                        value={tierForm.free_shipping_threshold}
                        onChange={(e) => setTierForm({ ...tierForm, free_shipping_threshold: Number(e.target.value) })}
                        min="0"
                        step="0.01"
                        placeholder="0 = شحن مجاني دائماً"
                        className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-purple-300 mb-2 text-sm font-medium">مكافأة عيد الميلاد (نقاط)</label>
                      <input
                        type="number"
                        value={tierForm.birthday_bonus}
                        onChange={(e) => setTierForm({ ...tierForm, birthday_bonus: Number(e.target.value) })}
                        min="0"
                        className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-purple-300 mb-2 text-sm font-medium">ترتيب المستوى</label>
                      <input
                        type="number"
                        value={tierForm.tier_order}
                        onChange={(e) => setTierForm({ ...tierForm, tier_order: Number(e.target.value) })}
                        min="1"
                        className="w-full px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Checkboxes */}
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                      <input
                        type="checkbox"
                        checked={tierForm.priority_support}
                        onChange={(e) => setTierForm({ ...tierForm, priority_support: e.target.checked })}
                        className="w-5 h-5 rounded border-purple-500/30 bg-white/5"
                      />
                      <label className="text-purple-300 cursor-pointer text-sm">دعم VIP ذو أولوية</label>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                      <input
                        type="checkbox"
                        checked={tierForm.exclusive_deals}
                        onChange={(e) => setTierForm({ ...tierForm, exclusive_deals: e.target.checked })}
                        className="w-5 h-5 rounded border-purple-500/30 bg-white/5"
                      />
                      <label className="text-purple-300 cursor-pointer text-sm">عروض حصرية</label>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                      <input
                        type="checkbox"
                        checked={tierForm.is_active}
                        onChange={(e) => setTierForm({ ...tierForm, is_active: e.target.checked })}
                        className="w-5 h-5 rounded border-purple-500/30 bg-white/5"
                      />
                      <label className="text-purple-300 cursor-pointer text-sm">تفعيل المستوى</label>
                    </div>
                  </div>
                </div>

                {/* الأزرار */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {editingTier ? 'تحديث المستوى' : 'إضافة المستوى'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTierModal(false)}
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
