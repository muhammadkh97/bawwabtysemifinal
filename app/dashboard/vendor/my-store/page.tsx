'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import FloatingAddButton from '@/components/dashboard/FloatingAddButton';
import { Store, Upload, Save, Eye, MapPin, Phone, Mail, Globe, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import LocationPicker from '@/components/dashboard/LocationPicker';

export default function VendorMyStorePage() {
  const { userId } = useAuth();
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Location state
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  
  // Logo state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  // Banner state
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string>('');
  const [bannerUrl, setBannerUrl] = useState<string>('');
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userId) {
      fetchStoreData();
    }
  }, [userId]);

  const fetchStoreData = async () => {
    try {
      // Get vendor data
      const { data: vendorData } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (vendorData) {
        setStoreName(vendorData.store_name || '');
        setStoreDescription(vendorData.description || '');
        setStoreAddress(vendorData.address || '');
        setPhone(vendorData.phone || '');
        setEmail(vendorData.email || '');
        setWebsite(vendorData.website || '');
        setLogoUrl(vendorData.logo_url || '');
        setBannerUrl(vendorData.banner_url || '');
        
        // Load location data
        setLatitude(vendorData.lat || vendorData.latitude || null);
        setLongitude(vendorData.lng || vendorData.longitude || null);
        
        if (vendorData.logo_url) {
          setLogoPreview(vendorData.logo_url);
        }
        if (vendorData.banner_url) {
          setBannerPreview(vendorData.banner_url);
        }
      }
    } catch (error) {
      console.error('Error fetching store data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setBannerFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setBannerPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const removeBanner = () => {
    setBannerFile(null);
    setBannerPreview('');
    if (bannerInputRef.current) {
      bannerInputRef.current.value = '';
    }
  };

  const uploadImage = async (file: File, folder: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('vendor-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('vendor-assets')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let newLogoUrl = logoUrl;
      let newBannerUrl = bannerUrl;

      // Upload logo if changed
      if (logoFile) {
        newLogoUrl = await uploadImage(logoFile, 'logos');
        setLogoUrl(newLogoUrl);
      } else if (!logoPreview) {
        newLogoUrl = '';
        setLogoUrl('');
      }

      // Upload banner if changed
      if (bannerFile) {
        newBannerUrl = await uploadImage(bannerFile, 'banners');
        setBannerUrl(newBannerUrl);
      } else if (!bannerPreview) {
        newBannerUrl = '';
        setBannerUrl('');
      }

      // Get vendor ID
      const { data: vendorData } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!vendorData) {
        // إنشاء سجل جديد للمتجر إذا لم يكن موجوداً
        const { error: insertError } = await supabase
          .from('stores')
          .insert({
            user_id: userId,
            store_name: storeName,
            name: storeName,
            description: storeDescription,
            address: storeAddress,
            phone: phone,
            email: email,
            logo_url: newLogoUrl,
            banner_url: newBannerUrl,
            lat: latitude,
            lng: longitude,
            latitude: latitude,
            longitude: longitude,
            is_active: true,
            approval_status: 'pending'
          });

        if (insertError) throw insertError;
      } else {
        // Update vendor data
        const { error } = await supabase
          .from('stores')
          .update({
            store_name: storeName,
            description: storeDescription,
            address: storeAddress,
            phone: phone,
            email: email,
            logo_url: newLogoUrl,
            banner_url: newBannerUrl,
            lat: latitude,
            lng: longitude,
            latitude: latitude,
            longitude: longitude,
            updated_at: new Date().toISOString()
          })
          .eq('id', vendorData.id);

        if (error) throw error;
      }

      // Update preview URLs with the new URLs
      if (newLogoUrl) {
        setLogoPreview(newLogoUrl);
        setLogoUrl(newLogoUrl);
      }
      if (newBannerUrl) {
        setBannerPreview(newBannerUrl);
        setBannerUrl(newBannerUrl);
      }

      alert('✅ تم حفظ التغييرات بنجاح!');
      
      // Clear file states
      setLogoFile(null);
      setBannerFile(null);
      
      // Refetch data to ensure preview is updated
      await fetchStoreData();
      
    } catch (error: any) {
      console.error('Error saving store:', error);
      alert('❌ حدث خطأ في حفظ التغييرات: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 transition-colors duration-300">
        <div className="md:mr-[280px] flex items-center justify-center h-screen">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 transition-colors duration-300">
      
      <div className="md:mr-[280px] transition-all duration-300">
        
        <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10 relative z-10 max-w-[1800px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-2">متجري</h1>
            <p className="text-purple-300 text-lg">إدارة معلومات وإعدادات متجرك</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* النموذج */}
            <div className="lg:col-span-2 space-y-6">
              {/* معلومات المتجر الأساسية */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-6"
                style={{
                  background: 'rgba(15, 10, 30, 0.6)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(98, 54, 255, 0.3)',
                }}
              >
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Store className="w-6 h-6" />
                  معلومات المتجر
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-purple-300 text-sm mb-2">اسم المتجر *</label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-white"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(98, 54, 255, 0.3)',
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-purple-300 text-sm mb-2">وصف المتجر *</label>
                    <textarea
                      value={storeDescription}
                      onChange={(e) => setStoreDescription(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl text-white resize-none"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(98, 54, 255, 0.3)',
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-purple-300 text-sm mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      العنوان *
                    </label>
                    <input
                      type="text"
                      value={storeAddress}
                      onChange={(e) => setStoreAddress(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-white"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(98, 54, 255, 0.3)',
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-purple-300 text-sm mb-2 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        رقم الهاتف *
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-white"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(98, 54, 255, 0.3)',
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-purple-300 text-sm mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        البريد الإلكتروني *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-white"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(98, 54, 255, 0.3)',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-purple-300 text-sm mb-2 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      الموقع الإلكتروني (اختياري)
                    </label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="w-full px-4 py-3 rounded-xl text-white"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(98, 54, 255, 0.3)',
                      }}
                    />
                  </div>
                </div>
              </motion.div>

              {/* الصور */}
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
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <ImageIcon className="w-6 h-6" />
                  الصور والشعار
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-purple-300 text-sm mb-2">شعار المتجر</label>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    {logoPreview ? (
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden group">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={removeLogo}
                          className="absolute top-2 right-2 p-2 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => logoInputRef.current?.click()}
                        className="w-full aspect-video rounded-xl flex items-center justify-center cursor-pointer transition-all hover:border-purple-400"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '2px dashed rgba(98, 54, 255, 0.3)',
                        }}
                      >
                        <div className="text-center">
                          <Upload className="w-12 h-12 text-purple-400 mx-auto mb-2" />
                          <p className="text-purple-300 text-sm">اضغط لرفع شعار المتجر</p>
                          <p className="text-purple-400 text-xs mt-1">PNG, JPG (مقاس: 500x500)</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-purple-300 text-sm mb-2">غلاف المتجر</label>
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBannerChange}
                      className="hidden"
                    />
                    {bannerPreview ? (
                      <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden group">
                        <img
                          src={bannerPreview}
                          alt="Banner preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={removeBanner}
                          className="absolute top-2 right-2 p-2 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => bannerInputRef.current?.click()}
                        className="w-full aspect-[3/1] rounded-xl flex items-center justify-center cursor-pointer transition-all hover:border-purple-400"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '2px dashed rgba(98, 54, 255, 0.3)',
                        }}
                      >
                        <div className="text-center">
                          <Upload className="w-12 h-12 text-purple-400 mx-auto mb-2" />
                          <p className="text-purple-300 text-sm">اضغط لرفع غلاف المتجر</p>
                          <p className="text-purple-400 text-xs mt-1">PNG, JPG (مقاس: 1920x640)</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* الموقع الجغرافي */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl p-6"
                style={{
                  background: 'rgba(15, 10, 30, 0.6)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(98, 54, 255, 0.3)',
                }}
              >
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <MapPin className="w-6 h-6" />
                  الموقع الجغرافي
                </h2>

                <LocationPicker
                  latitude={latitude}
                  longitude={longitude}
                  onLocationChange={(lat, lng) => {
                    setLatitude(lat);
                    setLongitude(lng);
                  }}
                />
              </motion.div>

              {/* أزرار الحفظ */}
              <div className="flex gap-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-white font-bold transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #6236FF, #FF219D)' }}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>حفظ التغييرات</span>
                    </>
                  )}
                </button>
                <button
                  disabled={saving}
                  className="px-6 py-4 rounded-xl text-white font-bold transition-all hover:shadow-lg disabled:opacity-50"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* المعاينة */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl p-6 sticky top-6"
                style={{
                  background: 'rgba(15, 10, 30, 0.6)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(98, 54, 255, 0.3)',
                }}
              >
                <h3 className="text-xl font-bold text-white mb-4">معاينة المتجر</h3>
                
                {/* معاينة البطاقة */}
                <div
                  className="rounded-xl overflow-hidden mb-4"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(98, 54, 255, 0.2)',
                  }}
                >
                  {/* الغلاف */}
                  <div
                    className="h-32 flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #6236FF, #FF219D)' }}
                  >
                    <ImageIcon className="w-12 h-12 text-white opacity-50" />
                  </div>
                  
                  {/* المحتوى */}
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #6236FF, #FF219D)' }}
                      >
                        <Store className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-bold text-lg mb-1">{storeName}</h4>
                        <p className="text-purple-300 text-xs line-clamp-2">{storeDescription}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-purple-300">
                        <MapPin className="w-4 h-4" />
                        <span className="text-xs">{storeAddress}</span>
                      </div>
                      <div className="flex items-center gap-2 text-purple-300">
                        <Phone className="w-4 h-4" />
                        <span className="text-xs">{phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-purple-300">
                        <Mail className="w-4 h-4" />
                        <span className="text-xs">{email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-purple-400 text-xs text-center">
                  هذه معاينة لكيفية ظهور متجرك للعملاء
                </p>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
      
      <FloatingAddButton />
    </div>
  );
}
