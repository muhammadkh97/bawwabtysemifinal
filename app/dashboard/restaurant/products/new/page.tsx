'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { toast } from 'react-hot-toast';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import { 
  ArrowRight, 
  Upload, 
  X, 
  Plus, 
  Trash2,
  Utensils,
  DollarSign,
  Package,
  Image as ImageIcon,
  Clock,
  Save,
  FileText
} from 'lucide-react';

interface ProductVariant {
  id: string;
  name: string;
  price: number;
}

export default function NewMealPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);

  // Basic info
  const [mealName, setMealName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [stock, setStock] = useState('100');
  const [preparationTime, setPreparationTime] = useState('');
  const [category, setCategory] = useState('');
  const [originalCurrency, setOriginalCurrency] = useState('SAR');

  // Images
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Variants
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Load vendor data
  useEffect(() => {
    const loadVendorData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Get vendor_id from user's metadata
      const { data: profile } = await supabase
        .from('users')
        .select('vendor_id')
        .eq('id', user.id)
        .single();

      if (profile?.vendor_id) {
        setVendorId(profile.vendor_id);
      } else {
        toast.error('لم يتم العثور على معرف المطعم');
      }
    };

    loadVendorData();
  }, [router]);

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = 5 - imageFiles.length;
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

  // Get currency name
  const getCurrencyName = (code: string): string => {
    const currencies: Record<string, string> = {
      'SAR': 'ريال',
      'USD': 'دولار',
      'EUR': 'يورو',
      'GBP': 'جنيه',
      'AED': 'درهم',
      'KWD': 'دينار',
      'BHD': 'دينار',
      'OMR': 'ريال',
      'QAR': 'ريال',
      'EGP': 'جنيه',
      'JOD': 'دينار',
      'ILS': 'شيكل'
    };
    return currencies[code] || 'ريال';
  };

  // Variant management
  const addVariant = () => {
    const newVariant: ProductVariant = {
      id: Date.now().toString(),
      name: '',
      price: 0
    };
    setVariants([...variants, newVariant]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  // Upload image to Supabase storage
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${vendorId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(fileName, file);
      
      if (uploadError) {
        const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error';
        logger.error('Failed to upload product image', { error: errorMessage, context: 'uploadImage' });
        return null;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);
      
      return publicUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to upload image in catch block', { error: errorMessage, context: 'uploadImage' });
      return null;
    }
  };

  // Generate slug from meal name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent, saveAs: 'draft' | 'publish' = 'publish') => {
    e.preventDefault();
    
    // Validation
    if (!mealName.trim()) {
      toast.error('يرجى إدخال اسم الوجبة');
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
    
    if (!vendorId) {
      toast.error('خطأ: معرف المطعم غير موجود');
      return;
    }
    
    setLoading(true);
    
    try {
      // Upload images
      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        const url = await uploadImage(file);
        if (url) {
          uploadedUrls.push(url);
        }
      }
      
      if (uploadedUrls.length === 0) {
        toast.error('فشل رفع الصور. يرجى المحاولة مرة أخرى');
        setLoading(false);
        return;
      }
      
      // Determine product status
      const productStatus = saveAs === 'draft' ? 'draft' : 'approved';
      
      // Prepare meal attributes (only preparation time now)
      const mealAttributes: any = {};
      if (preparationTime) mealAttributes.preparation_time = parseInt(preparationTime);
      
      // Prepare product data
      const productData = {
        vendor_id: vendorId,
        name: mealName.trim(),
        description: description.trim() || null,
        category_id: category || 'f4573c7e-b55a-4dd5-8e4b-22e51dcec6a0', // Grocery & Food category
        price: parseFloat(price),
        old_price: oldPrice ? parseFloat(oldPrice) : null,
        stock: 9999, // للمطاعم: المخزون غير محدود (يتم التحضير حسب الطلب)
        low_stock_threshold: 10,
        images: uploadedUrls,
        featured_image: uploadedUrls[0],
        status: productStatus,
        slug: generateSlug(mealName),
        has_variants: hasVariants,
        variants: hasVariants ? variants : null,
        attributes: mealAttributes,
        is_active: true,
        original_currency: originalCurrency
      };
      
      // Insert product
      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();
      
      if (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to save meal', { error: errorMessage, context: 'handleSubmit' });
        toast.error(`خطأ في حفظ الوجبة: ${error.message}`);
        setLoading(false);
        return;
      }
      
      // Success message
      if (productStatus === 'draft') {
        toast.success('✅ تم حفظ الوجبة كمسودة!');
      } else {
        toast.success('✅ تم نشر الوجبة بنجاح!');
      }
      
      router.push('/dashboard/restaurant/products');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to submit meal form', { error: errorMessage, context: 'handleSubmit' });
      toast.error('حدث خطأ غير متوقع');
      setLoading(false);
    }
  };

  return (
    <>
      <FuturisticNavbar />
      <div className="flex">
        <FuturisticSidebar role="restaurant" />
        <div className="md:mr-[280px] transition-all duration-300 w-full">
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Modern Header with Gradient */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            <span className="font-medium">رجوع</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
              <Utensils className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">
                إضافة وجبة جديدة
              </h1>
              <p className="text-white/90 text-lg">
                أضف وجبة جديدة إلى قائمة مطعمك
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={(e) => handleSubmit(e, 'publish')} className="space-y-6">
          {/* Basic Info Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
              <div className="flex items-center gap-3 text-white">
                <FileText className="w-6 h-6" />
                <h2 className="text-xl font-semibold">المعلومات الأساسية</h2>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Meal Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Utensils className="w-4 h-4" />
                  اسم الوجبة *
                </label>
                <input
                  type="text"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="مثال: برجر لحم مع بطاطس"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FileText className="w-4 h-4" />
                  الوصف
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="وصف تفصيلي للوجبة..."
                />
              </div>

              {/* Preparation Time */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="w-4 h-4" />
                  وقت التحضير (دقيقة)
                </label>
                <input
                  type="number"
                  value={preparationTime}
                  onChange={(e) => setPreparationTime(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="15"
                />
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
              <div className="flex items-center gap-3 text-white">
                <DollarSign className="w-6 h-6" />
                <h2 className="text-xl font-semibold">الأسعار</h2>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <DollarSign className="w-4 h-4" />
                    السعر ({getCurrencyName(originalCurrency)}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <DollarSign className="w-4 h-4" />
                    السعر القديم (اختياري)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={oldPrice}
                    onChange={(e) => setOldPrice(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <DollarSign className="w-4 h-4" />
                    العملة *
                  </label>
                  <select
                    value={originalCurrency}
                    onChange={(e) => setOriginalCurrency(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                    required
                  >
                    <option value="SAR">ريال سعودي (SAR)</option>
                    <option value="ILS">شيكل إسرائيلي (ILS)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                    <option value="EUR">يورو (EUR)</option>
                    <option value="GBP">جنيه إسترليني (GBP)</option>
                    <option value="AED">درهم إماراتي (AED)</option>
                    <option value="KWD">دينار كويتي (KWD)</option>
                    <option value="BHD">دينار بحريني (BHD)</option>
                    <option value="OMR">ريال عماني (OMR)</option>
                    <option value="QAR">ريال قطري (QAR)</option>
                    <option value="EGP">جنيه مصري (EGP)</option>
                    <option value="JOD">دينار أردني (JOD)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
              <div className="flex items-center gap-3 text-white">
                <ImageIcon className="w-6 h-6" />
                <h2 className="text-xl font-semibold">صور الوجبة *</h2>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-md shadow">
                          الصورة الرئيسية
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {imageFiles.length < 5 && (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    انقر لرفع الصور ({imageFiles.length}/5)
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    JPG, PNG (الحد الأقصى 5 صور)
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

          {/* Stock & Variants Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-600 px-6 py-4">
              <div className="flex items-center gap-3 text-white">
                <Package className="w-6 h-6" />
                <h2 className="text-xl font-semibold">المخزون والأحجام</h2>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Has Variants Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  الوجبة لها أحجام مختلفة
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasVariants}
                    onChange={(e) => setHasVariants(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Variants */}
              {hasVariants && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border-r-4 border-blue-500 p-4 rounded-lg mb-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      💡 <strong>نصيحة:</strong> أضف أحجام مختلفة للوجبة (صغير، وسط، كبير) مع السعر المناسب لكل حجم
                    </p>
                  </div>
                  
                  {variants.map((variant, index) => (
                    <div key={variant.id} className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl p-6 hover:border-orange-400 hover:shadow-lg transition-all">
                      <div className="absolute top-4 left-4 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        الحجم {index + 1}
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="absolute top-4 right-4 text-red-500 hover:text-white hover:bg-red-500 p-2 rounded-lg transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                        <div>
                          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">
                            🍽️ اسم الحجم
                          </label>
                          <input
                            type="text"
                            value={variant.name}
                            onChange={(e) => updateVariant(index, 'name', e.target.value)}
                            placeholder="مثال: صغير، وسط، كبير، عائلي"
                            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 block">
                            💰 السعر ({getCurrencyName(originalCurrency)})
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={variant.price}
                            onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value))}
                            placeholder="0.00"
                            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={addVariant}
                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl hover:from-orange-600 hover:to-red-600 font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    <Plus className="w-6 h-6" />
                    <span>إضافة حجم جديد</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  جاري النشر...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  نشر الوجبة
                </>
              )}
            </button>
            <button
              type="button"
              onClick={(e: any) => handleSubmit(e, 'draft')}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-4 rounded-xl hover:from-gray-600 hover:to-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  حفظ كمسودة
                </>
              )}
            </button>
          </div>
        </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
