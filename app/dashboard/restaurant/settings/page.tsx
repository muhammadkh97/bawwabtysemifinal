'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import { Store, Settings, MapPin, Phone, Clock, Save, Image, Globe, Power, Upload, X, Camera } from 'lucide-react';
import { uploadFile } from '@/lib/storage';
import LocationPicker from '@/components/dashboard/LocationPicker';
import './location-picker.css';

export default function RestaurantSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurantInfo, setRestaurantInfo] = useState<any>(null);
  const [formData, setFormData] = useState({
    shop_name: '',
    shop_name_ar: '',
    store_phone: '',
    store_address: '',
    store_address_ar: '',
    description: '',
    description_ar: '',
    opening_time: '',
    closing_time: '',
    is_online: true
  });

  // Image states
  const [coverImage, setCoverImage] = useState<string>('');
  const [logoImage, setLogoImage] = useState<string>('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // Location state
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

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

      // Fetch restaurant info
      const { data: restaurantData } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (restaurantData) {
        setRestaurantInfo(restaurantData);
        setFormData({
          shop_name: restaurantData.shop_name || '',
          shop_name_ar: restaurantData.shop_name_ar || '',
          store_phone: restaurantData.store_phone || '',
          store_address: restaurantData.store_address || '',
          store_address_ar: restaurantData.store_address_ar || '',
          description: restaurantData.description || '',
          description_ar: restaurantData.description_ar || '',
          opening_time: restaurantData.opening_time || '09:00',
          closing_time: restaurantData.closing_time || '23:00',
          is_online: restaurantData.is_online !== false
        });
        
        // Load images
        setCoverImage(restaurantData.cover_image || '');
        setLogoImage(restaurantData.logo || '');
        setGalleryImages(restaurantData.gallery_images || []);
        
        // Load location data
        setLatitude(restaurantData.lat || restaurantData.latitude || null);
        setLongitude(restaurantData.lng || restaurantData.longitude || null);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      router.push('/auth/login');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        ...formData,
        cover_image: coverImage,
        logo: logoImage,
        gallery_images: galleryImages,
        lat: latitude,
        lng: longitude,
        latitude: latitude,
        longitude: longitude
      };

      const { error } = await supabase
        .from('stores')
        .update(updateData)
        .eq('id', restaurantInfo.id);

      if (error) throw error;

      alert('تم حفظ التغييرات بنجاح');
      await checkAuth();
    } catch (error) {
      console.error('Error saving:', error);
      alert('حدث خطأ في حفظ التغييرات');
    } finally {
      setSaving(false);
    }
  };

  // Upload cover image
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const result = await uploadFile(file, {
        bucket: 'profiles',
        folder: `vendors/${restaurantInfo.id}`,
      });

      if (result.success && result.url) {
        setCoverImage(result.url);
        alert('تم رفع صورة الغلاف بنجاح');
      } else {
        throw new Error('فشل رفع الصورة');
      }
    } catch (error) {
      console.error('Error uploading cover:', error);
      alert('حدث خطأ في رفع الصورة');
    } finally {
      setUploadingCover(false);
    }
  };

  // Upload logo image
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const result = await uploadFile(file, {
        bucket: 'profiles',
        folder: `vendors/${restaurantInfo.id}`,
      });

      if (result.success && result.url) {
        setLogoImage(result.url);
        alert('تم رفع شعار المطعم بنجاح');
      } else {
        throw new Error('فشل رفع الصورة');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('حدث خطأ في رفع الصورة');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Upload gallery images
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (galleryImages.length + files.length > 10) {
      alert('يمكنك إضافة 10 صور كحد أقصى للمعرض');
      return;
    }

    setUploadingGallery(true);
    try {
      const uploadedUrls: string[] = [];
      
      for (const file of files) {
        const result = await uploadFile(file, {
          bucket: 'profiles',
          folder: `vendors/${restaurantInfo.id}/gallery`,
        });

        if (result.success && result.url) {
          uploadedUrls.push(result.url);
        }
      }

      setGalleryImages([...galleryImages, ...uploadedUrls]);
      alert(`تم رفع ${uploadedUrls.length} صورة بنجاح`);
    } catch (error) {
      console.error('Error uploading gallery:', error);
      alert('حدث خطأ في رفع الصور');
    } finally {
      setUploadingGallery(false);
    }
  };

  // Remove gallery image
  const removeGalleryImage = (index: number) => {
    setGalleryImages(galleryImages.filter((_, i) => i !== index));
  };

  const toggleOnlineStatus = async () => {
    try {
      const newStatus = !formData.is_online;
      const { error } = await supabase
        .from('stores')
        .update({ is_online: newStatus })
        .eq('id', restaurantInfo.id);

      if (error) throw error;

      setFormData({ ...formData, is_online: newStatus });
      alert(newStatus ? 'المطعم الآن متاح للطلبات' : 'المطعم الآن غير متاح للطلبات');
    } catch (error) {
      console.error('Error:', error);
      alert('حدث خطأ في تحديث الحالة');
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
            <h1 className="text-4xl font-black text-gray-900 mb-2">🏪 إعدادات المطعم</h1>
            <p className="text-gray-600">إدارة معلومات المطعم والإعدادات</p>
          </div>

          {restaurantInfo ? (
            <div className="space-y-6">
              {/* Online Status Card */}
              <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-3xl p-8 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">حالة المطعم</h2>
                    <p className="text-orange-100">
                      {formData.is_online ? 'المطعم متاح لاستقبال الطلبات' : 'المطعم غير متاح حالياً'}
                    </p>
                  </div>
                  <button
                    onClick={toggleOnlineStatus}
                    className={`px-8 py-4 rounded-2xl font-bold text-lg transition ${
                      formData.is_online
                        ? 'bg-white text-orange-600 hover:bg-gray-100'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Power className="w-6 h-6" />
                      {formData.is_online ? 'إيقاف الطلبات' : 'تفعيل الطلبات'}
                    </div>
                  </button>
                </div>
              </div>

              {/* Restaurant Images */}
              <div className="bg-white rounded-3xl p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Camera className="w-6 h-6 text-orange-600" />
                  صور المطعم
                </h2>

                {/* Cover Image */}
                <div className="mb-8">
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    صورة الغلاف
                  </label>
                  <div className="relative">
                    {coverImage ? (
                      <div className="relative aspect-[21/9] rounded-2xl overflow-hidden">
                        <img
                          src={coverImage}
                          alt="Cover"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => setCoverImage('')}
                          className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center aspect-[21/9] border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition">
                        <Upload className="w-12 h-12 text-gray-400 mb-2" />
                        <span className="text-gray-600 font-bold">اضغط لرفع صورة الغلاف</span>
                        <span className="text-sm text-gray-500 mt-1">الحجم الموصى به: 2100×900 بكسل</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverUpload}
                          disabled={uploadingCover}
                          className="hidden"
                        />
                      </label>
                    )}
                    {uploadingCover && (
                      <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <p>جاري الرفع...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Logo */}
                <div className="mb-8">
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    شعار المطعم (Logo)
                  </label>
                  <div className="relative">
                    {logoImage ? (
                      <div className="relative w-48 h-48 rounded-2xl overflow-hidden">
                        <img
                          src={logoImage}
                          alt="Logo"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => setLogoImage('')}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition">
                        <Upload className="w-10 h-10 text-gray-400 mb-2" />
                        <span className="text-gray-600 font-bold text-sm text-center">رفع الشعار</span>
                        <span className="text-xs text-gray-500 mt-1">500×500</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                          className="hidden"
                        />
                      </label>
                    )}
                    {uploadingLogo && (
                      <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Gallery */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    معرض الصور (حتى 10 صور)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {/* Existing Gallery Images */}
                    {galleryImages.map((image, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden">
                        <img
                          src={image}
                          alt={`Gallery ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeGalleryImage(index)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {/* Upload Button */}
                    {galleryImages.length < 10 && (
                      <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition">
                        <Upload className="w-8 h-8 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-600 font-bold">إضافة صورة</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleGalleryUpload}
                          disabled={uploadingGallery}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  {uploadingGallery && (
                    <div className="mt-4 p-4 bg-orange-50 rounded-xl flex items-center gap-3">
                      <div className="w-6 h-6 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-orange-800 font-bold">جاري رفع الصور...</span>
                    </div>
                  )}
                  <p className="text-sm text-gray-500 mt-3">
                    صور المعرض تظهر في صفحة المطعم للعملاء
                  </p>
                </div>
              </div>

              {/* Basic Info */}
              <div className="bg-white rounded-3xl p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Store className="w-6 h-6 text-orange-600" />
                  المعلومات الأساسية
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">اسم المطعم (عربي)</label>
                    <input
                      type="text"
                      value={formData.shop_name_ar}
                      onChange={(e) => setFormData({ ...formData, shop_name_ar: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">اسم المطعم (English)</label>
                    <input
                      type="text"
                      value={formData.shop_name}
                      onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهاتف</label>
                    <input
                      type="tel"
                      value={formData.store_phone}
                      onChange={(e) => setFormData({ ...formData, store_phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">العنوان (عربي)</label>
                    <input
                      type="text"
                      value={formData.store_address_ar}
                      onChange={(e) => setFormData({ ...formData, store_address_ar: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">الوصف (عربي)</label>
                    <textarea
                      value={formData.description_ar}
                      onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Working Hours */}
              <div className="bg-white rounded-3xl p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-orange-600" />
                  أوقات العمل
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">وقت الفتح</label>
                    <input
                      type="time"
                      value={formData.opening_time}
                      onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">وقت الإغلاق</label>
                    <input
                      type="time"
                      value={formData.closing_time}
                      onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="mt-6 p-4 bg-orange-50 rounded-xl">
                  <p className="text-sm text-orange-800">
                    <strong>ملاحظة:</strong> سيتم قبول الطلبات فقط خلال أوقات العمل المحددة
                  </p>
                </div>
              </div>

              {/* Location Section */}
              <div className="bg-white rounded-3xl p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-orange-600" />
                  الموقع الجغرافي
                </h2>

                <div className="location-picker-wrapper">
                  <LocationPicker
                    latitude={latitude}
                    longitude={longitude}
                    onLocationChange={(lat, lng) => {
                      setLatitude(lat);
                      setLongitude(lng);
                    }}
                  />
                </div>

                <div className="mt-4 p-4 bg-orange-50 rounded-xl">
                  <p className="text-sm text-orange-800">
                    <strong>ملاحظة:</strong> حدد موقع المطعم على الخريطة لتمكين العملاء من إيجادك بسهولة
                  </p>
                </div>
              </div>

              {/* Restaurant Status */}
              <div className="bg-white rounded-3xl p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">معلومات إضافية</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">حالة الموافقة</p>
                    <p className="font-bold text-lg">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        restaurantInfo.approval_status === 'approved' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {restaurantInfo.approval_status === 'approved' ? 'موافق عليه' : 'قيد المراجعة'}
                      </span>
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">نوع المتجر</p>
                    <p className="font-bold text-lg text-gray-900">مطعم</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-1">تاريخ التسجيل</p>
                    <p className="font-bold text-lg text-gray-900">
                      {new Date(restaurantInfo.created_at).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl font-bold text-lg hover:shadow-lg transition disabled:opacity-50"
                >
                  <Save className="w-6 h-6" />
                  {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 shadow-lg text-center">
              <Store className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">لا توجد بيانات</h2>
              <p className="text-gray-600">لم يتم العثور على معلومات المطعم</p>
            </div>
          )}
          </main>
        </div>
      </div>
    </>
  );
}
