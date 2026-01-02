'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import { Save, Package, Image as ImageIcon } from 'lucide-react';
import MultiImageUpload from '@/components/MultiImageUpload';
import PremiumCategorySelect from '@/components/PremiumCategorySelect';
import { uploadFile } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { generateSlug } from '@/lib/slug-utils';

interface Variant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  attributes: { [key: string]: string };
}

export default function NewProductPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [originalCurrency, setOriginalCurrency] = useState('SAR');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [stock, setStock] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [saveAs, setSaveAs] = useState<'draft' | 'approved'>('approved');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      console.log('🔍 [NewProduct] جلب التصنيفات...');
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, name_ar, requires_approval')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleImagesChange = (files: File[]) => {
    setImageFiles(files);
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        id: Date.now().toString(),
        name: '',
        sku: '',
        price: parseFloat(price) || 0,
        stock: 0,
        attributes: {},
      },
    ]);
  };

  const removeVariant = (id: string) => {
    setVariants(variants.filter(v => v.id !== id));
  };

  const updateVariant = (id: string, field: keyof Variant, value: any) => {
    setVariants(variants.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (imageFiles.length === 0) {
      toast.error('يرجى اختيار صورة واحدة على الأقل للمنتج');
      return;
    }

    // Validation for variants
    if (hasVariants) {
      if (variants.length === 0) {
        toast.error('يرجى إضافة متغير واحد على الأقل أو إلغاء تفعيل المتغيرات');
        return;
      }
      
      // Check all variants have required fields
      const invalidVariants = variants.filter(v => !v.name || v.price <= 0 || v.stock < 0);
      if (invalidVariants.length > 0) {
        toast.error('يرجى ملء جميع الحقول المطلوبة للمتغيرات');
        return;
      }
    }

    if (!userId) {
      toast.error('خطأ: يجب تسجيل الدخول أولاً');
      return;
    }

    setLoading(true);

    try {
      // Get vendor ID from vendors table
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (vendorError || !vendorData) {
        toast.error('⚠️ يجب أن تكون بائعاً لإضافة منتجات. يرجى إنشاء حساب بائع أولاً من صفحة "أصبح بائعاً"');
        setLoading(false);
        return;
      }

      // 1. Upload all images first
      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        const result = await uploadFile(file, {
          bucket: 'products',
          folder: vendorData.id,
        });
        if (result.success && result.url) {
          uploadedUrls.push(result.url);
        }
      }

      if (uploadedUrls.length === 0) {
        toast.error('فشل رفع الصور. يرجى المحاولة مرة أخرى');
        setLoading(false);
        return;
      }

      // Generate slug from product name using utility function
      const productSlug = generateSlug(productName);

      // التحقق من التصنيف وتحديد ما إذا كان يحتاج موافقة
      let productStatus = 'approved'; // الافتراضي: نشر مباشر
      
      if (saveAs === 'draft') {
        productStatus = 'draft'; // المسودات تبقى مسودات
      } else {
        // التحقق من التصنيف
        const selectedCategory = categories.find(cat => cat.id === categoryId);
        if (selectedCategory?.requires_approval) {
          // التصنيفات الطبية/الصحية تحتاج موافقة
          productStatus = 'pending';
          console.log('⚠️ [NewProduct] منتج طبي/صحي - يحتاج موافقة المدير');
        } else {
          // باقي المنتجات تنشر مباشرة
          productStatus = 'approved';
          console.log('✅ [NewProduct] منتج عادي - سينشر مباشرة');
        }
      }

      // إنشاء بيانات المنتج
      const productData = {
        name: productName,
        description: description,
        price: hasVariants ? variants[0].price : parseFloat(price),
        old_price: oldPrice ? parseFloat(oldPrice) : null,
        original_currency: originalCurrency,
        category_id: categoryId && categoryId.trim() !== '' ? categoryId : null,
        stock: hasVariants ? variants.reduce((sum, v) => sum + v.stock, 0) : parseInt(stock),
        low_stock_threshold: parseInt(lowStockThreshold),
        images: uploadedUrls,
        featured_image: uploadedUrls[0], // First image as featured
        status: productStatus,
        vendor_id: vendorData.id,
        slug: productSlug,
        has_variants: hasVariants,
        variants: hasVariants ? variants.map(v => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          price: v.price,
          stock: v.stock,
          attributes: v.attributes,
        })) : null,
      };

      // حفظ المنتج في قاعدة البيانات
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) {
        console.error('خطأ في حفظ المنتج:', error);
        toast.error(`خطأ في حفظ المنتج: ${error.message}`);
        setLoading(false);
        return;
      }

      // رسالة نجاح مخصصة حسب حالة المنتج
      if (productStatus === 'draft') {
        toast.success('✅ تم حفظ المنتج كمسودة! يمكنك نشره لاحقاً.');
      } else if (productStatus === 'pending') {
        toast.success('⏳ تم إرسال المنتج للمراجعة! (منتج طبي/صحي - بانتظار موافقة الإدارة)');
      } else {
        toast.success(`🎉 تم نشر المنتج بنجاح!${hasVariants ? ` مع ${variants.length} متغير` : ''} يمكن للعملاء رؤيته الآن.`);
      }
      
      // إعادة التوجيه إلى صفحة المنتجات
      router.push('/dashboard/vendor/products');
      
    } catch (err) {
      console.error('خطأ غير متوقع:', err);
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-[#0A0515] transition-colors duration-300">
      <FuturisticSidebar role="vendor" />
      
      <div className="md:mr-[280px] transition-all duration-300">
        <FuturisticNavbar userName="" userRole="بائع" />
        
        <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10 relative z-10 max-w-[1800px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-2">إضافة منتج جديد</h1>
            <p className="text-purple-300 text-lg">أضف منتج جديد إلى متجرك</p>
          </motion.div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-visible">
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-6 overflow-visible">
                {/* Basic Info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-6 overflow-visible"
                  style={{
                    background: 'rgba(15, 10, 30, 0.6)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(98, 54, 255, 0.3)',
                  }}
                >
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Package className="w-6 h-6" />
                    المعلومات الأساسية
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-purple-300 text-sm mb-2">
                        اسم المنتج *
                      </label>
                      <input
                        type="text"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-white bg-white/5 border border-purple-500/30 focus:border-purple-500 outline-none transition"
                        placeholder="مثال: هاتف سامسونج A54"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-purple-300 text-sm mb-2">
                        الوصف *
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={5}
                        className="w-full px-4 py-3 rounded-xl text-white bg-white/5 border border-purple-500/30 focus:border-purple-500 outline-none transition resize-none"
                        placeholder="اكتب وصفاً تفصيلياً للمنتج..."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-purple-300 text-sm mb-2">
                          السعر *
                        </label>
                        <input
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl text-white bg-white/5 border border-purple-500/30 focus:border-purple-500 outline-none transition"
                          placeholder="350"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-purple-300 text-sm mb-2">
                          العملة *
                        </label>
                        <select
                          value={originalCurrency}
                          onChange={(e) => setOriginalCurrency(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl text-white bg-white/5 border border-purple-500/30 focus:border-purple-500 outline-none transition"
                          required
                        >
                          <option value="SAR">ريال سعودي (SAR)</option>
                          <option value="USD">دولار أمريكي (USD)</option>
                          <option value="ILS">شيكل (ILS)</option>
                          <option value="EUR">يورو (EUR)</option>
                          <option value="GBP">جنيه إسترليني (GBP)</option>
                          <option value="AED">درهم إماراتي (AED)</option>
                          <option value="EGP">جنيه مصري (EGP)</option>
                          <option value="JOD">دينار أردني (JOD)</option>
                          <option value="KWD">دينار كويتي (KWD)</option>
                          <option value="QAR">ريال قطري (QAR)</option>
                          <option value="OMR">ريال عماني (OMR)</option>
                          <option value="BHD">دينار بحريني (BHD)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-purple-300 text-sm mb-2">
                          السعر القديم (اختياري)
                        </label>
                        <input
                          type="number"
                          value={oldPrice}
                          onChange={(e) => setOldPrice(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl text-white bg-white/5 border border-purple-500/30 focus:border-purple-500 outline-none transition"
                          placeholder="450"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <PremiumCategorySelect
                      categories={categories}
                      value={categoryId}
                      onChange={setCategoryId}
                      label="التصنيف"
                      placeholder="اختر التصنيف المناسب للمنتج"
                      required={true}
                      showApprovalBadge={true}
                    />
                  </div>
                </motion.div>

                {/* Stock Management */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-2xl p-6"
                  style={{
                    background: 'rgba(15, 10, 30, 0.6)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(98, 54, 255, 0.3)',
                  }}
                >
                  <h3 className="text-2xl font-bold text-white mb-6">إدارة المخزون</h3>
                  
                  {!hasVariants && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-purple-300 text-sm mb-2">
                          الكمية المتوفرة *
                        </label>
                        <input
                          type="number"
                          value={stock}
                          onChange={(e) => setStock(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl text-white bg-white/5 border border-purple-500/30 focus:border-purple-500 outline-none transition"
                          placeholder="100"
                          min="0"
                          required={!hasVariants}
                        />
                      </div>
                      <div>
                        <label className="block text-purple-300 text-sm mb-2">
                          تنبيه نقص المخزون
                        </label>
                        <input
                          type="number"
                          value={lowStockThreshold}
                          onChange={(e) => setLowStockThreshold(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl text-white bg-white/5 border border-purple-500/30 focus:border-purple-500 outline-none transition"
                          placeholder="10"
                          min="0"
                        />
                      </div>
                    </div>
                  )}

                  {/* Enable Variants Toggle */}
                  <div className="mt-4 p-4 rounded-xl bg-white/5 border border-purple-500/20">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasVariants}
                        onChange={(e) => {
                          setHasVariants(e.target.checked);
                          if (!e.target.checked) {
                            setVariants([]);
                          }
                        }}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-semibold text-white">إضافة متغيرات (مقاسات/ألوان)</p>
                        <p className="text-xs text-purple-300 mt-1">أضف مقاسات أو ألوان مختلفة لكل منها سعر وكمية منفصلة</p>
                      </div>
                    </label>
                  </div>
                </motion.div>

                {/* Product Variants */}
                {hasVariants && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="rounded-2xl p-6"
                    style={{
                      background: 'rgba(15, 10, 30, 0.6)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(98, 54, 255, 0.3)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-white">المتغيرات</h3>
                      <button
                        type="button"
                        onClick={addVariant}
                        className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-all hover:shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #6236FF, #FF219D)' }}
                      >
                        + إضافة متغير
                      </button>
                    </div>

                    {variants.length === 0 ? (
                      <div className="text-center py-8 text-purple-300">
                        <p>لم تضف أي متغيرات بعد</p>
                        <p className="text-sm mt-2">اضغط "إضافة متغير" لإضافة مقاس أو لون جديد</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {variants.map((variant, index) => (
                          <div
                            key={variant.id}
                            className="p-4 rounded-xl bg-white/5 border border-purple-500/20 space-y-3"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-white font-semibold">متغير {index + 1}</span>
                              <button
                                type="button"
                                onClick={() => removeVariant(variant.id)}
                                className="text-red-400 hover:text-red-300 text-sm"
                              >
                                ✕ حذف
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-purple-300 text-xs mb-1">
                                  اسم المتغير *
                                </label>
                                <input
                                  type="text"
                                  value={variant.name}
                                  onChange={(e) => updateVariant(variant.id, 'name', e.target.value)}
                                  placeholder="مثال: أحمر - XL"
                                  className="w-full px-3 py-2 rounded-lg text-white text-sm bg-white/5 border border-purple-500/30 focus:border-purple-500 outline-none"
                                  required={hasVariants}
                                />
                              </div>

                              <div>
                                <label className="block text-purple-300 text-xs mb-1">
                                  رمز SKU
                                </label>
                                <input
                                  type="text"
                                  value={variant.sku}
                                  onChange={(e) => updateVariant(variant.id, 'sku', e.target.value)}
                                  placeholder="SKU-001"
                                  className="w-full px-3 py-2 rounded-lg text-white text-sm bg-white/5 border border-purple-500/30 focus:border-purple-500 outline-none"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-purple-300 text-xs mb-1">
                                  السعر *
                                </label>
                                <input
                                  type="number"
                                  value={variant.price}
                                  onChange={(e) => updateVariant(variant.id, 'price', parseFloat(e.target.value) || 0)}
                                  placeholder="350"
                                  min="0"
                                  step="0.01"
                                  className="w-full px-3 py-2 rounded-lg text-white text-sm bg-white/5 border border-purple-500/30 focus:border-purple-500 outline-none"
                                  required={hasVariants}
                                />
                              </div>

                              <div>
                                <label className="block text-purple-300 text-xs mb-1">
                                  الكمية *
                                </label>
                                <input
                                  type="number"
                                  value={variant.stock}
                                  onChange={(e) => updateVariant(variant.id, 'stock', parseInt(e.target.value) || 0)}
                                  placeholder="50"
                                  min="0"
                                  className="w-full px-3 py-2 rounded-lg text-white text-sm bg-white/5 border border-purple-500/30 focus:border-purple-500 outline-none"
                                  required={hasVariants}
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-purple-300 text-xs mb-1">
                                اللون (اختياري)
                              </label>
                              <input
                                type="text"
                                value={variant.attributes.color || ''}
                                onChange={(e) => updateVariant(variant.id, 'attributes', { ...variant.attributes, color: e.target.value })}
                                placeholder="أحمر، أزرق، أخضر"
                                className="w-full px-3 py-2 rounded-lg text-white text-sm bg-white/5 border border-purple-500/30 focus:border-purple-500 outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-purple-300 text-xs mb-1">
                                المقاس (اختياري)
                              </label>
                              <input
                                type="text"
                                value={variant.attributes.size || ''}
                                onChange={(e) => updateVariant(variant.id, 'attributes', { ...variant.attributes, size: e.target.value })}
                                placeholder="S, M, L, XL, XXL"
                                className="w-full px-3 py-2 rounded-lg text-white text-sm bg-white/5 border border-purple-500/30 focus:border-purple-500 outline-none"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Images */}
                      {/* Media Upload */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-2xl p-6"
                  style={{
                    background: 'rgba(15, 10, 30, 0.6)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(98, 54, 255, 0.3)',
                  }}
                >
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <ImageIcon className="w-6 h-6" />
                    صور المنتج
                  </h3>
                  
                  <div className="space-y-4">
                    <MultiImageUpload
                      onImagesChange={handleImagesChange}
                      maxImages={8}
                    />
                  </div>
                </motion.div>

                {/* Publishing Options */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-2xl p-6"
                  style={{
                    background: 'rgba(15, 10, 30, 0.6)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(98, 54, 255, 0.3)',
                  }}
                >
                  <h3 className="text-2xl font-bold text-white mb-4">خيارات النشر</h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all"
                      style={{
                        background: saveAs === 'approved' ? 'rgba(98, 54, 255, 0.3)' : 'rgba(255,255,255,0.05)',
                        border: `2px solid ${saveAs === 'approved' ? '#6236FF' : 'rgba(98, 54, 255, 0.2)'}`,
                      }}>
                      <input
                        type="radio"
                        name="saveAs"
                        value="approved"
                        checked={saveAs === 'approved'}
                        onChange={(e) => setSaveAs(e.target.value as any)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-semibold text-white">نشر مباشرة</p>
                        <p className="text-xs text-purple-300 mt-1">المنتجات العادية تنشر فوراً، والطبية تحتاج موافقة</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all"
                      style={{
                        background: saveAs === 'draft' ? 'rgba(98, 54, 255, 0.3)' : 'rgba(255,255,255,0.05)',
                        border: `2px solid ${saveAs === 'draft' ? '#6236FF' : 'rgba(98, 54, 255, 0.2)'}`,
                      }}>
                      <input
                        type="radio"
                        name="saveAs"
                        value="draft"
                        checked={saveAs === 'draft'}
                        onChange={(e) => setSaveAs(e.target.value as any)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-semibold text-white">حفظ كمسودة</p>
                        <p className="text-xs text-purple-300 mt-1">سيمكنك التعديل لاحقاً</p>
                      </div>
                    </label>
                  </div>
                </motion.div>

                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-3"
                >
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-white font-bold transition-all hover:shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #6236FF, #FF219D)' }}
                  >
                    <Save className="w-5 h-5" />
                    <span>حفظ المنتج</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="w-full px-6 py-4 rounded-xl text-white font-bold transition-all hover:shadow-lg bg-white/10"
                  >
                    إلغاء
                  </button>
                </motion.div>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
