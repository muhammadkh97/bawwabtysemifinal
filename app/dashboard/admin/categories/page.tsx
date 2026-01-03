'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  Save, 
  X, 
  LayoutGrid,
  Smartphone,
  Shirt,
  Home,
  ShoppingBasket,
  Sparkles,
  UtensilsCrossed,
  Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Category } from '@/types';

const iconOptions = [
  'Smartphone', 'Shirt', 'Home', 'ShoppingBasket', 'Sparkles', 'UtensilsCrossed', 'Box'
];

const iconMap: { [key: string]: any } = {
  'Smartphone': Smartphone,
  'Shirt': Shirt,
  'Home': Home,
  'ShoppingBasket': ShoppingBasket,
  'Sparkles': Sparkles,
  'UtensilsCrossed': UtensilsCrossed,
  'Box': Box,
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    try {
      if (editingCategory.id) {
        const { error } = await supabase
          .from('categories')
          .update({
            name: editingCategory.name,
            name_ar: editingCategory.name_ar,
            slug: editingCategory.slug,
            icon: editingCategory.icon,
            parent_id: editingCategory.parent_id || null,
            display_order: editingCategory.display_order,
            is_active: editingCategory.is_active
          })
          .eq('id', editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([{
            name: editingCategory.name,
            name_ar: editingCategory.name_ar,
            slug: editingCategory.slug,
            icon: editingCategory.icon,
            parent_id: editingCategory.parent_id || null,
            display_order: editingCategory.display_order,
            is_active: editingCategory.is_active,
            level: editingCategory.parent_id ? 1 : 0
          }]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟ سيتم حذف جميع التصنيفات الفرعية المرتبطة به.')) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.name_ar.includes(searchQuery)
  );

  const mainCategories = filteredCategories.filter(c => !c.parent_id);

  return (
    <div className="p-6 bg-[#0A0515] min-h-screen text-white" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black mb-2">إدارة التصنيفات</h1>
          <p className="text-purple-300/60">تحكم في هيكل الأقسام الرئيسي والفرعي للمنصة</p>
        </div>
        <button
          onClick={() => {
            setEditingCategory({ name: '', name_ar: '', slug: '', icon: 'Box', display_order: 0, is_active: true });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold hover:scale-105 transition-transform shadow-lg shadow-purple-500/20"
        >
          <Plus className="w-5 h-5" />
          إضافة تصنيف جديد
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 w-5 h-5" />
        <input
          type="text"
          placeholder="ابحث عن تصنيف..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pr-12 pl-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-purple-500 outline-none transition-all"
        />
      </div>

      {/* Categories List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-purple-300">جاري تحميل البيانات...</p>
          </div>
        ) : (
          mainCategories.map(main => (
            <div key={main.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-4 flex items-center justify-between hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center text-purple-400">
                    {(() => {
                      const Icon = iconMap[main.icon || 'Box'] || Box;
                      return <Icon className="w-6 h-6" />;
                    })()}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{main.name_ar}</h3>
                    <span className="text-xs text-purple-400/60">{main.slug}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingCategory(main);
                      setIsModalOpen(true);
                    }}
                    className="p-2 hover:bg-purple-500/20 rounded-lg text-purple-400 transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(main.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Subcategories */}
              <div className="bg-black/20 border-t border-white/5">
                {categories.filter(sub => sub.parent_id === main.id).map(sub => (
                  <div key={sub.id} className="p-3 pr-16 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <ChevronLeft className="w-4 h-4 text-purple-500/40" />
                      <span className="font-medium text-purple-100">{sub.name_ar}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingCategory(sub);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 hover:bg-purple-500/20 rounded-lg text-purple-400 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(sub.id)}
                        className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => {
                    setEditingCategory({ name: '', name_ar: '', slug: '', icon: 'Box', parent_id: main.id, display_order: 0, is_active: true });
                    setIsModalOpen(true);
                  }}
                  className="w-full p-3 pr-16 text-right text-sm text-purple-400 hover:text-purple-300 hover:bg-white/5 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  إضافة تصنيف فرعي لـ {main.name_ar}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#150B25] border border-purple-500/30 rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-2xl font-black">
                  {editingCategory?.id ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-purple-300 mb-2">الاسم (English)</label>
                    <input
                      type="text"
                      required
                      value={editingCategory?.name || ''}
                      onChange={e => setEditingCategory({...editingCategory!, name: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-purple-300 mb-2">الاسم (عربي)</label>
                    <input
                      type="text"
                      required
                      value={editingCategory?.name_ar || ''}
                      onChange={e => setEditingCategory({...editingCategory!, name_ar: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 outline-none text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-purple-300 mb-2">الرابط (Slug)</label>
                    <input
                      type="text"
                      required
                      value={editingCategory?.slug || ''}
                      onChange={e => setEditingCategory({...editingCategory!, slug: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-purple-300 mb-2">الأيقونة</label>
                    <select
                      value={editingCategory?.icon || 'Box'}
                      onChange={e => setEditingCategory({...editingCategory!, icon: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 outline-none"
                    >
                      {iconOptions.map(opt => (
                        <option key={opt} value={opt} className="bg-[#150B25]">{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-8">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-8 py-3 rounded-xl font-bold hover:bg-white/5 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform"
                  >
                    حفظ التغييرات
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChevronLeft(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
