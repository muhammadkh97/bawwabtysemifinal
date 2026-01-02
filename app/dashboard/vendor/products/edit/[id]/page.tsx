'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import PremiumCategorySelect from '@/components/PremiumCategorySelect';
import { Save, Package, Loader2, ArrowRight } from 'lucide-react';
import MultiImageUpload from '@/components/MultiImageUpload';
import { uploadFile } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { userId } = useAuth();
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [stock, setStock] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchProductData();
      fetchCategories();
    }
  }, [userId, params.id]);

  const fetchProductData = async () => {
    try {
      setLoading(true);
      
      // التحقق من صلاحيات البائع
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!vendorData) {
        toast.error('خطأ: لم يتم العثور على بيانات البائع');
        router.push('/dashboard/vendor');
        return;
      }

      // جلب بيانات المنتج
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', params.id)
        .eq('vendor_id', vendorData.id)
        .single();

      if (error || !product) {
        toast.error('خطأ: لم يتم العثور على المنتج');
        router.push('/dashboard/vendor/products');
        return;
      }

      // ملء البيانات
      setProductName(product.name || '');
      setDescription(product.description || '');
      setPrice(product.price?.toString() || '');
      setOldPrice(product.old_price?.toString() || '');
      setCategoryId(product.category_id || '');
      setStock(product.stock?.toString() || '');
      setLowStockThreshold(product.low_stock_threshold?.toString() || '10');
      setExistingImages(product.images || []);

    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('حدث خطأ أثناء تحميل بيانات المنتج');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, name_ar')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      toast.error('خطأ: يجب تسجيل الدخول أولاً');
      return;
    }

    try {
      setSaving(true);

      // التحقق من صلاحيات البائع
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!vendorData) {
        toast.error('خطأ: لم يتم العثور على بيانات البائع');
        return;
      }

      // رفع الصور الجديدة إن وجدت
      let allImages = [...existingImages];
      if (imageFiles.length > 0) {
        const uploadPromises = imageFiles.map(file => 
          uploadFile(file, { 
            bucket: 'product-images',
            folder: 'products'
          })
        );
        const uploadResults = await Promise.all(uploadPromises);
        const newImageUrls = uploadResults
          .filter(result => result.success && result.url)
          .map(result => result.url as string);
        allImages = [...allImages, ...newImageUrls];
      }

      // تحديث بيانات المنتج
      const { error: updateError } = await supabase
        .from('products')
        .update({
          name: productName,
          description,
          price: parseFloat(price),
          old_price: oldPrice ? parseFloat(oldPrice) : null,
          category_id: categoryId,
          stock: parseInt(stock),
          low_stock_threshold: parseInt(lowStockThreshold),
          images: allImages,
          featured_image: allImages[0] || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)
        .eq('vendor_id', vendorData.id);

      if (updateError) throw updateError;

      toast.success('تم تحديث المنتج بنجاح! ✨');
      router.push('/dashboard/vendor/products');
      
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('حدث خطأ أثناء تحديث المنتج');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0A0515] transition-colors duration-300">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-800 dark:text-purple-300 text-lg">جاري تحميل بيانات المنتج...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-[#0A0515] transition-colors duration-300">
      <FuturisticSidebar role="vendor" />
      
      <div className="md:mr-[280px] transition-all duration-300">
        <FuturisticNavbar userName="" userRole="بائع" />
        
        <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10 relative z-10 max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="w-12 h-12 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                style={{
                  background: 'rgba(139, 92, 246, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                }}
              >
                <ArrowRight className="w-6 h-6 text-purple-400" />
              </button>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                  <Package className="w-10 h-10 text-purple-400" />
                  تعديل المنتج
                </h1>
                <p className="text-purple-300 text-lg">تحديث معلومات المنتج</p>
              </div>
            </div>
          </motion.div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl p-8 space-y-6"
            style={{
              background: 'rgba(15, 10, 30, 0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(98, 54, 255, 0.3)',
            }}
          >
            {/* اسم المنتج */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                اسم المنتج <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-white text-right"
                style={{
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                }}
                placeholder="أدخل اسم المنتج"
              />
            </div>

            {/* الوصف */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                الوصف <span className="text-red-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
                className="w-full px-4 py-3 rounded-xl text-white text-right resize-none"
                style={{
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                }}
                placeholder="أدخل وصف المنتج"
              />
            </div>

            {/* التصنيف */}
            <PremiumCategorySelect
              categories={categories}
              value={categoryId}
              onChange={setCategoryId}
              label="التصنيف"
              placeholder="اختر التصنيف المناسب للمنتج"
              required={true}
              showApprovalBadge={true}
            />

            {/* السعر والسعر القديم */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  السعر (ر.س) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-xl text-white text-right"
                  style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                  }}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  السعر القديم (ر.س)
                </label>
                <input
                  type="number"
                  value={oldPrice}
                  onChange={(e) => setOldPrice(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-xl text-white text-right"
                  style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                  }}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* الكمية */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  الكمية المتوفرة <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                  min="0"
                  className="w-full px-4 py-3 rounded-xl text-white text-right"
                  style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                  }}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  حد التنبيه للمخزون
                </label>
                <input
                  type="number"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  min="0"
                  className="w-full px-4 py-3 rounded-xl text-white text-right"
                  style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                  }}
                  placeholder="10"
                />
              </div>
            </div>

            {/* الصور */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                صور المنتج
              </label>
              <p className="text-purple-300 text-sm mb-4">
                الصور الحالية: {existingImages.length} صورة
              </p>
              <MultiImageUpload
                onImagesChange={handleImagesChange}
                maxImages={5}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <motion.button
                type="submit"
                disabled={saving}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-8 py-4 rounded-2xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(90deg, #6236FF, #B621FE)',
                  boxShadow: '0 0 30px rgba(98, 54, 255, 0.5)',
                }}
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري الحفظ...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Save className="w-5 h-5" />
                    حفظ التعديلات
                  </span>
                )}
              </motion.button>
            </div>
          </motion.form>
        </main>
      </div>
    </div>
  );
}
