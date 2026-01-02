'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import { Save, Package, Image as ImageIcon, Plus, X, ChefHat, DollarSign, Trash2, Settings, Boxes } from 'lucide-react';
import { uploadFile } from '@/lib/storage';
import { generateSlug } from '@/lib/slug-utils';

// التصنيفات الغذائية الافتراضية
const FOOD_CATEGORIES = [
  { id: 'burgers', name_ar: '🍔 برجر', name: 'Burgers' },
  { id: 'pizza', name_ar: '🍕 بيتزا', name: 'Pizza' },
  { id: 'shawarma', name_ar: '🌯 شاورما', name: 'Shawarma' },
  { id: 'grills', name_ar: '🍖 مشاوي', name: 'Grills' },
  { id: 'chicken', name_ar: '🍗 دجاج', name: 'Chicken' },
  { id: 'seafood', name_ar: '🦐 مأكولات بحرية', name: 'Seafood' },
  { id: 'pasta', name_ar: '🍝 معكرونة', name: 'Pasta' },
  { id: 'salads', name_ar: '🥗 سلطات', name: 'Salads' },
  { id: 'appetizers', name_ar: '🥙 مقبلات', name: 'Appetizers' },
  { id: 'sandwiches', name_ar: '🥪 سندويشات', name: 'Sandwiches' },
  { id: 'meals', name_ar: '🍛 وجبات', name: 'Meals' },
  { id: 'desserts', name_ar: '🍰 حلويات', name: 'Desserts' },
  { id: 'drinks', name_ar: '🥤 مشروبات', name: 'Drinks' },
  { id: 'breakfast', name_ar: '🍳 إفطار', name: 'Breakfast' },
];

interface Variant {
  id: string;
  name: string;
  price_adjustment: number;
  is_default: boolean;
}

interface VariantGroup {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  required: boolean;
  variants: Variant[];
}

export default function EditRestaurantProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vendorId, setVendorId] = useState<string>('');
  
  // Form Data
  const [formData, setFormData] = useState({
    name_ar: '',
    name: '',
    description_ar: '',
    description: '',
    price: '',
    sale_price: '',
    stock: '100',
    category_id: '',
    is_active: true
  });

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [variantGroups, setVariantGroups] = useState<VariantGroup[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Get vendor/restaurant ID
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (vendorData) {
        setVendorId(vendorData.id);
        await Promise.all([
          fetchCategories(),
          fetchProduct(vendorData.id)
        ]);
      } else {
        alert('لم يتم العثور على حساب المطعم');
        router.push('/dashboard/restaurant');
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      router.push('/auth/login');
    }
  };

  const fetchProduct = async (vId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('vendor_id', vId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          name_ar: data.name_ar || '',
          name: data.name || '',
          description_ar: data.description_ar || '',
          description: data.description || '',
          price: data.price?.toString() || '',
          sale_price: data.sale_price?.toString() || '',
          stock: data.stock?.toString() || '100',
          category_id: data.category_id || '',
          is_active: data.is_active !== false
        });

        setExistingImages(data.images || []);
        setVariantGroups(data.variant_groups || []);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      alert('حدث خطأ في جلب بيانات المنتج');
      router.push('/dashboard/restaurant/products');
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await supabase
        .from('categories')
        .select('id, name, name_ar')
        .eq('is_active', true)
        .order('name_ar');

      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Variant Management Functions
  const addVariantGroup = () => {
    const newGroup: VariantGroup = {
      id: Date.now().toString(),
      name: '',
      type: 'single',
      required: false,
      variants: []
    };
    setVariantGroups([...variantGroups, newGroup]);
  };

  const removeVariantGroup = (groupId: string) => {
    setVariantGroups(variantGroups.filter(g => g.id !== groupId));
  };

  const updateVariantGroup = (groupId: string, field: keyof VariantGroup, value: any) => {
    setVariantGroups(variantGroups.map(g => 
      g.id === groupId ? { ...g, [field]: value } : g
    ));
  };

  const addVariantToGroup = (groupId: string) => {
    const newVariant: Variant = {
      id: Date.now().toString(),
      name: '',
      price_adjustment: 0,
      is_default: false
    };
    setVariantGroups(variantGroups.map(g => 
      g.id === groupId ? { ...g, variants: [...g.variants, newVariant] } : g
    ));
  };

  const removeVariantFromGroup = (groupId: string, variantId: string) => {
    setVariantGroups(variantGroups.map(g => 
      g.id === groupId ? { ...g, variants: g.variants.filter(v => v.id !== variantId) } : g
    ));
  };

  const updateVariant = (groupId: string, variantId: string, field: keyof Variant, value: any) => {
    setVariantGroups(variantGroups.map(g => 
      g.id === groupId ? {
        ...g,
        variants: g.variants.map(v => 
          v.id === variantId ? { ...v, [field]: value } : v
        )
      } : g
    ));
  };

  const handleNewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + newImageFiles.length + existingImages.length > 5) {
      alert('يمكنك إضافة 5 صور كحد أقصى');
      return;
    }

    setNewImageFiles([...newImageFiles, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImageFiles(newImageFiles.filter((_, i) => i !== index));
    setNewImagePreviews(newImagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name_ar || !formData.price) {
      alert('الرجاء ملء الحقول المطلوبة (الاسم والسعر)');
      return;
    }

    if (existingImages.length === 0 && newImageFiles.length === 0) {
      alert('الرجاء إضافة صورة واحدة على الأقل');
      return;
    }

    // Validate variant groups
    for (const group of variantGroups) {
      if (!group.name.trim()) {
        alert('الرجاء إدخال اسم لكل مجموعة متغيرات');
        return;
      }
      if (group.variants.length === 0) {
        alert(`مجموعة "${group.name}" يجب أن تحتوي على خيار واحد على الأقل`);
        return;
      }
      for (const variant of group.variants) {
        if (!variant.name.trim()) {
          alert(`الرجاء إدخال اسم لكل خيار في مجموعة "${group.name}"`);
          return;
        }
      }
    }

    setSaving(true);

    try {
      // Upload new images if any
      const uploadedUrls: string[] = [];
      for (const file of newImageFiles) {
        const result = await uploadFile(file, {
          bucket: 'products',
          folder: vendorId,
        });
        if (result.success && result.url) {
          uploadedUrls.push(result.url);
        }
      }

      // Combine existing and new images
      const allImages = [...existingImages, ...uploadedUrls];

      if (allImages.length === 0) {
        alert('فشل رفع الصور. يرجى المحاولة مرة أخرى');
        setSaving(false);
        return;
      }

      // Update product
      const { error } = await supabase
        .from('products')
        .update({
          name: formData.name || formData.name_ar,
          name_ar: formData.name_ar,
          description: formData.description,
          description_ar: formData.description_ar,
          price: parseFloat(formData.price),
          sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
          stock: parseInt(formData.stock),
          category_id: formData.category_id || null,
          images: allImages,
          featured_image: allImages[0],
          variant_groups: variantGroups,
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (error) throw error;

      alert('✅ تم تحديث الوجبة بنجاح!');
      router.push('/dashboard/restaurant/products');
    } catch (error) {
      console.error('Error updating product:', error);
      alert('حدث خطأ في تحديث الوجبة');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('هل أنت متأكد من حذف هذه الوجبة؟ لا يمكن التراجع عن هذا الإجراء.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      alert('تم حذف الوجبة بنجاح');
      router.push('/dashboard/restaurant/products');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('حدث خطأ في حذف الوجبة');
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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-black text-gray-900 mb-2">✏️ تعديل الوجبة</h1>
            <p className="text-gray-600">قم بتعديل معلومات الوجبة</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Images Upload */}
            <div className="bg-white rounded-3xl p-8 shadow-lg mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <ImageIcon className="w-6 h-6 text-orange-600" />
                صور الوجبة
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                {/* Existing Images */}
                {existingImages.map((image, index) => (
                  <motion.div
                    key={`existing-${index}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100"
                  >
                    <img
                      src={image}
                      alt={`Existing ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}

                {/* New Images */}
                {newImagePreviews.map((preview, index) => (
                  <motion.div
                    key={`new-${index}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100"
                  >
                    <img
                      src={preview}
                      alt={`New ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                      جديد
                    </div>
                  </motion.div>
                ))}

                {existingImages.length + newImageFiles.length < 5 && (
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition">
                    <Plus className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">إضافة صورة</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleNewImageChange}
                      className="hidden"
                      multiple
                    />
                  </label>
                )}
              </div>

              <p className="text-sm text-gray-600">
                يمكنك إضافة حتى 5 صور. الصورة الأولى ستكون الصورة الرئيسية.
              </p>
            </div>

            {/* Basic Info */}
            <div className="bg-white rounded-3xl p-8 shadow-lg mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <ChefHat className="w-6 h-6 text-orange-600" />
                معلومات الوجبة
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    اسم الوجبة (عربي) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="مثال: برجر لحم فاخر"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    اسم الوجبة (English)
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Premium Beef Burger"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    الوصف (عربي)
                  </label>
                  <textarea
                    value={formData.description_ar}
                    onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="اكتب وصفاً شاملاً للوجبة، المكونات، والإضافات..."
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    التصنيف
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">اختر التصنيف</option>
                    {FOOD_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name_ar}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Variants Section */}
            <div className="bg-white rounded-3xl p-8 shadow-lg mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Settings className="w-6 h-6 text-orange-600" />
                    المتغيرات والخيارات
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    مثل: الحجم (صغير، وسط، كبير)، الإضافات (جبنة، خضار)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addVariantGroup}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition"
                >
                  <Plus className="w-4 h-4" />
                  إضافة مجموعة
                </button>
              </div>

              {variantGroups.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-2xl">
                  <Settings className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">لا توجد متغيرات بعد</p>
                  <p className="text-sm text-gray-500">اضغط "إضافة مجموعة" لإضافة متغيرات للوجبة</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <AnimatePresence>
                    {variantGroups.map((group, groupIndex) => (
                      <motion.div
                        key={group.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200"
                      >
                        {/* Group Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="مثال: الحجم"
                              value={group.name}
                              onChange={(e) => updateVariantGroup(group.id, 'name', e.target.value)}
                              className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-lg"
                            />
                            
                            <div className="flex items-center gap-4 mt-3">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  checked={group.type === 'single'}
                                  onChange={() => updateVariantGroup(group.id, 'type', 'single')}
                                  className="w-4 h-4 text-purple-600"
                                />
                                <span className="text-sm font-bold text-gray-700">اختيار واحد</span>
                              </label>
                              
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  checked={group.type === 'multiple'}
                                  onChange={() => updateVariantGroup(group.id, 'type', 'multiple')}
                                  className="w-4 h-4 text-purple-600"
                                />
                                <span className="text-sm font-bold text-gray-700">اختيار متعدد</span>
                              </label>

                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={group.required}
                                  onChange={(e) => updateVariantGroup(group.id, 'required', e.target.checked)}
                                  className="w-4 h-4 text-purple-600 rounded"
                                />
                                <span className="text-sm font-bold text-gray-700">إجباري</span>
                              </label>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeVariantGroup(group.id)}
                            className="mr-4 p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Variants */}
                        <div className="space-y-3">
                          {group.variants.map((variant, variantIndex) => (
                            <motion.div
                              key={variant.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center gap-3 bg-white p-3 rounded-xl"
                            >
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                <input
                                  type="text"
                                  placeholder="مثال: كبير"
                                  value={variant.name}
                                  onChange={(e) => updateVariant(group.id, variant.id, 'name', e.target.value)}
                                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-600">السعر الإضافي:</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={variant.price_adjustment}
                                    onChange={(e) => updateVariant(group.id, variant.id, 'price_adjustment', parseFloat(e.target.value) || 0)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  />
                                  <span className="text-sm text-gray-600">₪</span>
                                </div>

                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={variant.is_default}
                                    onChange={(e) => updateVariant(group.id, variant.id, 'is_default', e.target.checked)}
                                    className="w-4 h-4 text-purple-600 rounded"
                                  />
                                  <span className="text-sm font-bold text-gray-700">افتراضي</span>
                                </label>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeVariantFromGroup(group.id, variant.id)}
                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </motion.div>
                          ))}

                          <button
                            type="button"
                            onClick={() => addVariantToGroup(group.id)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-100 text-purple-700 rounded-xl font-bold hover:bg-purple-200 transition"
                          >
                            <Plus className="w-4 h-4" />
                            إضافة خيار
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Pricing & Stock */}
            <div className="bg-white rounded-3xl p-8 shadow-lg mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-orange-600" />
                السعر والمخزون
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    السعر (₪) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="45.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    السعر بعد الخصم (₪)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="39.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    الكمية المتوفرة
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-xl flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                />
                <label htmlFor="is_active" className="text-sm font-bold text-gray-900 cursor-pointer">
                  الوجبة متاحة للعملاء
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl font-bold text-lg hover:shadow-lg transition disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    حفظ التغييرات
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="px-8 py-4 bg-red-600 text-white rounded-2xl font-bold text-lg hover:bg-red-700 transition flex items-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                حذف
              </button>

              <button
                type="button"
                onClick={() => router.push('/dashboard/restaurant/products')}
                className="px-8 py-4 bg-gray-200 text-gray-700 rounded-2xl font-bold text-lg hover:bg-gray-300 transition"
              >
                إلغاء
              </button>
            </div>
          </form>
          </main>
        </div>
      </div>
    </>
  );
}
