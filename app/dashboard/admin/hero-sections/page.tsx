'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit, Trash2, Eye, EyeOff, Upload, Save, X } from 'lucide-react';
import Image from 'next/image';

interface HeroSection {
  id: string;
  title: string;
  title_ar?: string;
  subtitle?: string;
  subtitle_ar?: string;
  image_url?: string;
  mobile_image_url?: string;
  button_text?: string;
  button_text_ar?: string;
  button_link?: string;
  background_color?: string;
  text_color?: string;
  is_active?: boolean;
  display_order?: number;
  page?: string;
}

export default function HeroSectionsManager() {
  const [sections, setSections] = useState<HeroSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingSection, setEditingSection] = useState<HeroSection | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<HeroSection>>({
    title: '',
    title_ar: '',
    subtitle: '',
    subtitle_ar: '',
    image_url: '',
    mobile_image_url: '',
    button_text: '',
    button_text_ar: '',
    button_link: '',
    background_color: '#FF6B35',
    text_color: '#FFFFFF',
    is_active: true,
    display_order: 1,
    page: 'home'
  });

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('hero_sections')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        throw new Error(`فشل تحميل الشرائح: ${error.message}`);
      }
      
      setSections(data || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء تحميل البيانات';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      if (editingSection) {
        // تحديث
        const { error } = await supabase
          .from('hero_sections')
          .update(formData)
          .eq('id', editingSection.id);

        if (error) {
          throw new Error(`فشل تحديث الشريحة: ${error.message}`);
        }
        alert('✅ تم تحديث الشريحة بنجاح!');
      } else {
        // إضافة جديد
        const { error } = await supabase
          .from('hero_sections')
          .insert([formData]);

        if (error) {
          throw new Error(`فشل إضافة الشريحة: ${error.message}`);
        }
        alert('✅ تم إضافة الشريحة بنجاح!');
      }

      await fetchSections();
      closeModal();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء الحفظ';
      alert(`❌ ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الشريحة؟')) return;

    try {
      const { error } = await supabase
        .from('hero_sections')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`فشل حذف الشريحة: ${error.message}`);
      }
      
      alert('✅ تم حذف الشريحة بنجاح!');
      await fetchSections();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء الحذف';
      alert(`❌ ${errorMessage}`);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('hero_sections')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) {
        throw new Error(`فشل تغيير حالة التفعيل: ${error.message}`);
      }
      
      await fetchSections();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء تغيير الحالة';
      alert(`❌ ${errorMessage}`);
    }
  };

  const openEditModal = (section: HeroSection) => {
    setEditingSection(section);
    setFormData(section);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingSection(null);
    setFormData({
      title: '',
      title_ar: '',
      subtitle: '',
      subtitle_ar: '',
      image_url: '',
      mobile_image_url: '',
      button_text: '',
      button_text_ar: '',
      button_link: '',
      background_color: '#FF6B35',
      text_color: '#FFFFFF',
      is_active: true,
      display_order: sections.length + 1,
      page: 'home'
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSection(null);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto" dir="rtl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="h-9 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-5 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
          <div className="h-12 bg-gray-200 rounded-lg w-40 animate-pulse"></div>
        </div>
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-48 h-32 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                  <div className="flex gap-2">
                    <div className="h-10 bg-gray-200 rounded w-20"></div>
                    <div className="h-10 bg-gray-200 rounded w-20"></div>
                    <div className="h-10 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="fixed inset-0 bg-black/5 flex items-center justify-center pointer-events-none">
          <div className="bg-white p-6 rounded-xl shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-3"></div>
            <p className="text-gray-600 text-sm">جارٍ تحميل البيانات...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto" dir="rtl">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="mr-3">
              <h3 className="text-lg font-semibold text-red-800">فشل تحميل البيانات</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={() => fetchSections()}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة شرائح Hero</h1>
          <p className="text-gray-600 mt-1">تحكم في شرائح العرض الرئيسية للموقع</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة شريحة جديدة</span>
        </button>
      </div>

      {/* Sections Grid */}
      <div className="grid gap-6">
        {sections.map((section) => (
          <div
            key={section.id}
            className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition"
          >
            <div className="flex flex-col md:flex-row">
              {/* Image Preview */}
              <div className="md:w-1/3 relative h-48 md:h-auto bg-gray-100">
                {section.image_url ? (
                  <Image
                    src={section.image_url}
                    alt={section.title_ar || section.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <Upload className="w-12 h-12" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {section.title_ar || section.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {section.subtitle_ar || section.subtitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: section.background_color, color: section.text_color }}
                    >
                      معاينة اللون
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      section.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {section.is_active ? 'مفعّل' : 'معطّل'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                  <div>
                    <span className="font-semibold">الزر:</span> {section.button_text_ar || section.button_text}
                  </div>
                  <div>
                    <span className="font-semibold">الرابط:</span> {section.button_link}
                  </div>
                  <div>
                    <span className="font-semibold">الترتيب:</span> {section.display_order}
                  </div>
                  <div>
                    <span className="font-semibold">الصفحة:</span> {section.page}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(section)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                  >
                    <Edit className="w-4 h-4" />
                    <span>تعديل</span>
                  </button>
                  <button
                    onClick={() => toggleActive(section.id, section.is_active || false)}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition"
                  >
                    {section.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{section.is_active ? 'تعطيل' : 'تفعيل'}</span>
                  </button>
                  <button
                    onClick={() => handleDelete(section.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingSection ? 'تعديل الشريحة' : 'إضافة شريحة جديدة'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* العنوان */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    العنوان (عربي) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title_ar || ''}
                    onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="أدخل العنوان بالعربية"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    العنوان (English)
                  </label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter title in English"
                  />
                </div>
              </div>

              {/* الوصف */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    الوصف (عربي)
                  </label>
                  <textarea
                    value={formData.subtitle_ar || ''}
                    onChange={(e) => setFormData({ ...formData, subtitle_ar: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                    placeholder="أدخل الوصف بالعربية"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    الوصف (English)
                  </label>
                  <textarea
                    value={formData.subtitle || ''}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter description in English"
                  />
                </div>
              </div>

              {/* الصور */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    رابط الصورة (Desktop)
                  </label>
                  <input
                    type="url"
                    value={formData.image_url || ''}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.image_url && (
                    <div className="mt-2 relative h-32 rounded-lg overflow-hidden">
                      <Image
                        src={formData.image_url}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    رابط الصورة (Mobile)
                  </label>
                  <input
                    type="url"
                    value={formData.mobile_image_url || ''}
                    onChange={(e) => setFormData({ ...formData, mobile_image_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://example.com/mobile-image.jpg"
                  />
                </div>
              </div>

              {/* الزر */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    نص الزر (عربي)
                  </label>
                  <input
                    type="text"
                    value={formData.button_text_ar || ''}
                    onChange={(e) => setFormData({ ...formData, button_text_ar: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="تسوق الآن"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    نص الزر (English)
                  </label>
                  <input
                    type="text"
                    value={formData.button_text || ''}
                    onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Shop Now"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    رابط الزر
                  </label>
                  <input
                    type="text"
                    value={formData.button_link || ''}
                    onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="/products"
                  />
                </div>
              </div>

              {/* الألوان والإعدادات */}
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    لون الخلفية
                  </label>
                  <input
                    type="color"
                    value={formData.background_color || '#FF6B35'}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    لون النص
                  </label>
                  <input
                    type="color"
                    value={formData.text_color || '#FFFFFF'}
                    onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ترتيب العرض
                  </label>
                  <input
                    type="number"
                    value={formData.display_order || 1}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    الصفحة
                  </label>
                  <select
                    value={formData.page || 'home'}
                    onChange={(e) => setFormData({ ...formData, page: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="home">الرئيسية</option>
                    <option value="products">المنتجات</option>
                    <option value="about">من نحن</option>
                  </select>
                </div>
              </div>

              {/* التفعيل */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active || false}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                />
                <label htmlFor="is_active" className="text-sm font-semibold text-gray-700">
                  تفعيل الشريحة
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>جارٍ الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>{editingSection ? 'حفظ التعديلات' : 'إضافة الشريحة'}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
