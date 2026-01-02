'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { uploadFile } from '@/lib/storage';
import { generateSlug } from '@/lib/slug-utils';
import toast from 'react-hot-toast';
import { 
  ArrowRight, 
  Upload, 
  X, 
  Plus, 
  Trash2,
  Package,
  DollarSign,
  Image as ImageIcon,
  Save,
  FileText,
  Tag,
  Box,
  Layers
} from 'lucide-react';

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
  const [loading, setLoading] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);

  // Basic info
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [originalCurrency, setOriginalCurrency] = useState('SAR');
  const [categoryId, setCategoryId] = useState('');
  const [stock, setStock] = useState('100');
  const [lowStockThreshold, setLowStockThreshold] = useState('10');

  // Images
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Categories
  const [categories, setCategories] = useState<any[]>([]);

  // Variants
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);

  // Publishing option
  const [saveAs, setSaveAs] = useState<'draft' | 'approved'>('approved');

  // Load vendor data
  useEffect(() => {
    const loadVendorData = async () => {
      if (!userId) {
        router.push('/auth/login');
        return;
      }

      // Get vendor ID
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (vendorError || !vendorData) {
        toast.error('⚠️ يجب أن تكون بائعاً لإضافة منتجات');
        router.push('/dashboard');
        return;
      }

      setVendorId(vendorData.id);
    };

    loadVendorData();
  }, [userId, router]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, name_ar, requires_approval')
        .eq('is_active', true)
        .order('name');

      if (!error && data) {
        setCategories(data);
      }
    };

    fetchCategories();
  }, []);

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = 8 - imageFiles.length;
    const filesToAdd = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      toast.error(`يمكنك رفع ${remainingSlots} صور فقط`);
    }

    setImageFiles([...imageFiles, ...filesToAdd]);

    filesToAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove image
  const removeImage = (index: number) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  // Variant management
  const addVariant = () => {
    const newVariant: Variant = {
      id: Date.now().toString(),
      name: '',
      sku: '',
      price: parseFloat(price) || 0,
      stock: 100,
      attributes: {}
    };
    setVariants([...variants, newVariant]);
  };

  const removeVariant = (id: string) => {
    setVariants(variants.filter(v => v.id !== id));
  };

  const updateVariant = (id: string, field: keyof Variant, value: any) => {
    setVariants(variants.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    ));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!productName.trim()) {
      toast.error('يرجى إدخال اسم المنتج');
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      toast.error('يرجى إدخال سعر صحيح');
      return;
    }

    if (imageFiles.length === 0) {
      toast.error('يرجى رفع صورة واحدة على الأقل');
      return;
    }

    if (hasVariants && variants.length === 0) {
      toast.error('يرجى إضافة متغير واحد على الأقل أو إلغاء تفعيل المتغيرات');
      return;
    }

    if (hasVariants) {
      const invalidVariants = variants.filter(v => !v.name || v.price <= 0 || v.stock < 0);
      if (invalidVariants.length > 0) {
        toast.error('يرجى ملء جميع الحقول المطلوبة للمتغيرات');
        return;
      }
    }

    if (!vendorId) {
      toast.error('خطأ: معرف البائع غير موجود');
      return;
    }

    setLoading(true);

    try {
      // Upload images
      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        const result = await uploadFile(file, {
          bucket: 'products',
          folder: vendorId,
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

      // Determine product status
      let productStatus = 'approved';
      
      if (saveAs === 'draft') {
        productStatus = 'draft';
      } else {
        const selectedCategory = categories.find(cat => cat.id === categoryId);
        if (selectedCategory?.requires_approval) {
          productStatus = 'pending';
        }
      }

      // Prepare product data
      const productData = {
        name: productName,
        description: description,
        price: hasVariants ? variants[0].price : parseFloat(price),
        old_price: oldPrice ? parseFloat(oldPrice) : null,
        original_currency: originalCurrency,
        category_id: categoryId || null,
        stock: hasVariants ? variants.reduce((sum, v) => sum + v.stock, 0) : parseInt(stock),
        low_stock_threshold: parseInt(lowStockThreshold),
        images: uploadedUrls,
        featured_image: uploadedUrls[0],
        status: productStatus,
        vendor_id: vendorId,
        slug: generateSlug(productName),
        has_variants: hasVariants,
        variants: hasVariants ? variants : null,
        is_active: true
      };

      // Insert product
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (error) {
        console.error('Error saving product:', error);
        toast.error(`خطأ في حفظ المنتج: ${error.message}`);
        setLoading(false);
        return;
      }

      // Success messages
      if (productStatus === 'draft') {
        toast.success('✅ تم حفظ المنتج كمسودة!');
      } else if (productStatus === 'pending') {
        toast.success('⏳ تم إرسال المنتج للمراجعة!');
      } else {
        toast.success('🎉 تم نشر المنتج بنجاح!');
      }
      
      router.push('/dashboard/vendor/products');
      
    } catch (err) {
      console.error('Error:', err);
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Header with Gradient */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            <span className="font-medium">رجوع</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">
                إضافة منتج جديد
              </h1>
              <p className="text-white/90 text-lg">
                أضف منتج جديد إلى متجرك وابدأ البيع
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - 2 Columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                  <div className="flex items-center gap-3 text-white">
                    <FileText className="w-6 h-6" />
                    <h2 className="text-xl font-semibold">المعلومات الأساسية</h2>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Product Name */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Package className="w-4 h-4" />
                      اسم المنتج *
                    </label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                      placeholder="مثال: هاتف سامسونج A54"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <FileText className="w-4 h-4" />
                      الوصف *
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all resize-none"
                      placeholder="اكتب وصفاً تفصيلياً للمنتج..."
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Tag className="w-4 h-4" />
                      التصنيف *
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                      required
                    >
                      <option value="">اختر التصنيف</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name_ar || cat.name}
                          {cat.requires_approval && ' (يحتاج موافقة)'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                  <div className="flex items-center gap-3 text-white">
                    <DollarSign className="w-6 h-6" />
                    <h2 className="text-xl font-semibold">الأسعار والعملة</h2>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <DollarSign className="w-4 h-4" />
                        السعر *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                        placeholder="350.00"
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <DollarSign className="w-4 h-4" />
                        السعر القديم
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={oldPrice}
                        onChange={(e) => setOldPrice(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                        placeholder="450.00"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        العملة *
                      </label>
                      <select
                        value={originalCurrency}
                        onChange={(e) => setOriginalCurrency(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
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
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stock & Variants Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-600 px-6 py-4">
                  <div className="flex items-center gap-3 text-white">
                    <Box className="w-6 h-6" />
                    <h2 className="text-xl font-semibold">المخزون والمتغيرات</h2>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Has Variants Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Layers className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        المنتج له متغيرات (مقاسات/ألوان)
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasVariants}
                        onChange={(e) => {
                          setHasVariants(e.target.checked);
                          if (!e.target.checked) setVariants([]);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Stock (if no variants) */}
                  {!hasVariants && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <Package className="w-4 h-4" />
                          الكمية المتوفرة *
                        </label>
                        <input
                          type="number"
                          value={stock}
                          onChange={(e) => setStock(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                          placeholder="100"
                          min="0"
                          required={!hasVariants}
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          تنبيه نقص المخزون
                        </label>
                        <input
                          type="number"
                          value={lowStockThreshold}
                          onChange={(e) => setLowStockThreshold(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                          placeholder="10"
                          min="0"
                        />
                      </div>
                    </div>
                  )}

                  {/* Variants */}
                  {hasVariants && (
                    <div className="space-y-4">
                      {variants.map((variant, index) => (
                        <div key={variant.id} className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 transition-colors">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              متغير #{index + 1}
                            </h3>
                            <button
                              type="button"
                              onClick={() => removeVariant(variant.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                اسم المتغير *
                              </label>
                              <input
                                type="text"
                                value={variant.name}
                                onChange={(e) => updateVariant(variant.id, 'name', e.target.value)}
                                placeholder="مثال: أحمر - XL"
                                className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                                required={hasVariants}
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                رمز SKU
                              </label>
                              <input
                                type="text"
                                value={variant.sku}
                                onChange={(e) => updateVariant(variant.id, 'sku', e.target.value)}
                                placeholder="SKU-001"
                                className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                السعر *
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={variant.price}
                                onChange={(e) => updateVariant(variant.id, 'price', parseFloat(e.target.value) || 0)}
                                placeholder="350.00"
                                className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                                min="0"
                                required={hasVariants}
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                الكمية *
                              </label>
                              <input
                                type="number"
                                value={variant.stock}
                                onChange={(e) => updateVariant(variant.id, 'stock', parseInt(e.target.value) || 0)}
                                placeholder="100"
                                className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                                min="0"
                                required={hasVariants}
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                اللون (اختياري)
                              </label>
                              <input
                                type="text"
                                value={variant.attributes.color || ''}
                                onChange={(e) => updateVariant(variant.id, 'attributes', { ...variant.attributes, color: e.target.value })}
                                placeholder="أحمر، أزرق، أخضر"
                                className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                المقاس (اختياري)
                              </label>
                              <input
                                type="text"
                                value={variant.attributes.size || ''}
                                onChange={(e) => updateVariant(variant.id, 'attributes', { ...variant.attributes, size: e.target.value })}
                                placeholder="S, M, L, XL"
                                className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <button
                        type="button"
                        onClick={addVariant}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 px-4 py-2 rounded-lg transition-all"
                      >
                        <Plus className="w-5 h-5" />
                        <span>إضافة متغير</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar - 1 Column */}
            <div className="space-y-6">
              {/* Images Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
                  <div className="flex items-center gap-3 text-white">
                    <ImageIcon className="w-6 h-6" />
                    <h2 className="text-xl font-semibold">صور المنتج</h2>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  {/* Image Previews */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg shadow-md"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {index === 0 && (
                            <span className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-md shadow">
                              رئيسية
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Button */}
                  {imageFiles.length < 8 && (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        رفع الصور ({imageFiles.length}/8)
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        JPG, PNG
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Publishing Options */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-blue-600 px-6 py-4">
                  <div className="flex items-center gap-3 text-white">
                    <Save className="w-6 h-6" />
                    <h2 className="text-xl font-semibold">خيارات النشر</h2>
                  </div>
                </div>
                
                <div className="p-6 space-y-3">
                  <label className="flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-all border-2"
                    style={{
                      backgroundColor: saveAs === 'approved' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      borderColor: saveAs === 'approved' ? '#3b82f6' : 'rgba(209, 213, 219, 0.5)',
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
                      <p className="font-semibold text-gray-900 dark:text-white">نشر مباشرة</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        المنتجات العادية تنشر فوراً
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-all border-2"
                    style={{
                      backgroundColor: saveAs === 'draft' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      borderColor: saveAs === 'draft' ? '#3b82f6' : 'rgba(209, 213, 219, 0.5)',
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
                      <p className="font-semibold text-gray-900 dark:text-white">حفظ كمسودة</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        يمكنك التعديل ونشره لاحقاً
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      حفظ المنتج
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-4 rounded-xl hover:from-gray-600 hover:to-gray-700 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
