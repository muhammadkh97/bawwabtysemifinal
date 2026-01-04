'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LoyaltyCard from '@/components/LoyaltyCard';
import CountryPhoneInput from '@/components/CountryPhoneInput';
import LocationsManager from '@/components/LocationsManager';
import CurrencySelector from '@/components/CurrencySelector';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Upload, Camera } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string;
  avatar_url?: string;
  role: 'customer' | 'vendor' | 'driver' | 'admin';
  loyalty_points?: number;
  created_at: string;
}

interface UserAddress {
  id: string;
  user_id: string;
  title: string; // منزل، عمل، آخر
  full_address: string;
  city: string;
  area: string;
  street: string;
  building: string;
  floor?: string;
  apartment?: string;
  landmark?: string;
  lat?: number;
  lng?: number;
  phone: string;
  is_default: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // دالة لترجمة نوع الحساب
  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      'customer': '👤 عميل',
      'vendor': '🏪 بائع',
      'driver': '🚗 مندوب',
      'admin': '👨‍💼 مدير'
    };
    return roles[role] || '👤 عميل';
  };

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Password change states
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [newAddress, setNewAddress] = useState<Partial<UserAddress>>({
    title: 'منزل',
    city: 'عمان',
    is_default: false,
  });

  const fetchUserData = async () => {
    try {
      console.log('🔍 [Profile] جلب بيانات المستخدم...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ [Profile] لا يوجد مستخدم مسجل دخول');
        router.push('/auth/login');
        return;
      }

      console.log('✅ [Profile] Auth User ID:', user.id);

      // جلب البيانات مباشرة من public.users لضمان الحصول على آخر التحديثات
      const { data: userData, error: directError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('📊 [Profile] بيانات من الجدول مباشرة:', userData);
      console.log('🎭 [Profile] دور المستخدم:', userData?.role);

      if (directError || !userData) {
        console.error('❌ [Profile] فشل جلب البيانات:', directError);
        setLoading(false);
        return;
      }

      // تحديث الـ state مباشرة بالبيانات من قاعدة البيانات
      setProfile({
        id: userData.id,
        email: userData.email,
        name: userData.name || 'مستخدم',
        phone: userData.phone || '',
        avatar_url: userData.avatar_url,
        role: userData.role || 'customer',
        loyalty_points: userData.loyalty_points || 0,
        created_at: userData.created_at,
      });

      setFullName(userData.name || '');
      setPhone(userData.phone || '');
      setAvatarPreview(userData.avatar_url || null);

      // Fetch user addresses
      const { data: addressesData } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (addressesData) {
        setAddresses(addressesData);
      }

      console.log('✅ [Profile] تم تحميل البيانات بنجاح');
      setLoading(false);
    } catch (error) {
      console.error('❌ [Profile] خطأ غير متوقع:', error);
      setLoading(false);
    }
  };

  // تحميل البيانات عند فتح الصفحة
  useEffect(() => {
    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // التحقق من نوع الملف
      if (!file.type.startsWith('image/')) {
        alert('❌ يرجى اختيار صورة صالحة');
        return;
      }
      
      // التحقق من حجم الملف (أقل من 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('❌ حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
      }
      
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpdateProfile = async () => {
    try {
      if (!profile) return;

      let avatarUrl = profile.avatar_url;

      // Upload avatar to Supabase Storage (if avatars bucket exists)
      if (avatarFile) {
        try {
          const fileExt = avatarFile.name.split('.').pop();
          const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, avatarFile, { upsert: true });

          if (uploadError) {
            console.warn('⚠️ [Profile] تعذر رفع الصورة:', uploadError.message);
            // Continue without updating avatar
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName);

            avatarUrl = publicUrl;
          }
        } catch (storageError) {
          console.warn('⚠️ [Profile] Storage bucket غير متوفر، تم تخطي رفع الصورة');
          // Continue without avatar upload
        }
      }

      // Update profile in database
      console.log('🔄 [Profile] تحديث البيانات...');
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: fullName,
          phone: phone,
          avatar_url: avatarUrl,
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error('❌ [Profile] خطأ في التحديث:', updateError);
        console.error('❌ [Profile] تفاصيل الخطأ:', JSON.stringify(updateError, null, 2));
        throw updateError;
      }
      
      console.log('✅ [Profile] تم التحديث بنجاح');

      // Update local state
      setProfile({
        ...profile,
        name: fullName,
        phone: phone,
        avatar_url: avatarUrl,
      });

      setAvatarPreview(avatarUrl || null);
      alert('✅ تم تحديث الملف الشخصي بنجاح!');
      setEditMode(false);
      setAvatarFile(null);
      
      // Reload data to ensure sync
      await fetchUserData();
    } catch (error) {
      console.error('❌ [Profile] Error updating profile:', error);
      alert('❌ حدث خطأ أثناء التحديث. يرجى المحاولة مرة أخرى.');
    }
  };

  const handleChangePassword = async () => {
    try {
      // التحقق من الحقول
      if (!currentPassword || !newPassword || !confirmPassword) {
        alert('❌ يرجى ملء جميع الحقول');
        return;
      }

      // التحقق من تطابق كلمة المرور الجديدة
      if (newPassword !== confirmPassword) {
        alert('❌ كلمة المرور الجديدة غير متطابقة');
        return;
      }

      // التحقق من طول كلمة المرور
      if (newPassword.length < 6) {
        alert('❌ كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        return;
      }

      console.log('🔐 [Profile] تغيير كلمة المرور...');

      // تغيير كلمة المرور
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('❌ [Profile] خطأ في تغيير كلمة المرور:', error);
        throw error;
      }

      console.log('✅ [Profile] تم تغيير كلمة المرور بنجاح');
      alert('✅ تم تغيير كلمة المرور بنجاح!');
      
      // إعادة تعيين الحقول
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
    } catch (error: any) {
      console.error('❌ [Profile] Error changing password:', error);
      alert('❌ حدث خطأ أثناء تغيير كلمة المرور: ' + (error.message || 'يرجى المحاولة مرة أخرى'));
    }
  };

  const handleAddAddress = async () => {
    try {
      if (!profile) return;

      const addressToAdd = {
        user_id: profile.id,
        title: newAddress.title || 'منزل',
        full_address: `${newAddress.city}, ${newAddress.area}, ${newAddress.street}, ${newAddress.building}`,
        city: newAddress.city || '',
        area: newAddress.area || '',
        street: newAddress.street || '',
        building: newAddress.building || '',
        floor: newAddress.floor,
        apartment: newAddress.apartment,
        landmark: newAddress.landmark,
        phone: newAddress.phone || '',
        is_default: newAddress.is_default || false,
        lat: newAddress.lat,
        lng: newAddress.lng,
      };

      // If this is default, unset other defaults
      if (addressToAdd.is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', profile.id);
      }

      const { data, error } = await supabase
        .from('addresses')
        .insert([addressToAdd])
        .select()
        .single();

      if (error) throw error;

      setAddresses([...addresses, data]);
      setShowAddressForm(false);
      setNewAddress({ title: 'منزل', city: 'عمان', is_default: false });
      alert('✅ تم إضافة العنوان بنجاح!');
    } catch (error) {
      console.error('Error adding address:', error);
      alert('❌ حدث خطأ أثناء إضافة العنوان.');
    }
  };

  const handleDeleteAddress = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العنوان؟')) {
      setAddresses(addresses.filter(addr => addr.id !== id));
      alert('✅ تم حذف العنوان');
    }
  };

  const handleSetDefault = (id: string) => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      is_default: addr.id === id,
    })));
    alert('✅ تم تعيين العنوان الافتراضي');
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setNewAddress({
            ...newAddress,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          alert(`✅ تم تحديد الموقع: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
        },
        (error) => {
          alert('❌ فشل الحصول على الموقع. يرجى السماح بالوصول للموقع.');
        }
      );
    } else {
      alert('❌ المتصفح لا يدعم خاصية تحديد الموقع');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-transparent bg-clip-text" style={{ 
              background: 'linear-gradient(90deg, #6236FF, #FF219D)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              الملف الشخصي 👤
            </h1>
            <p className="text-sm sm:text-base text-gray-600">إدارة معلوماتك الشخصية وعناوينك</p>
          </div>

          {/* Profile Information */}
          <div className="backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 border border-gray-200" style={{ background: 'rgba(255, 255, 255, 0.95)' }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">المعلومات الشخصية</h2>
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 rounded-xl font-medium text-sm sm:text-base text-white hover:opacity-90 transition"
                  style={{ background: 'linear-gradient(90deg, #6236FF, #FF219D)' }}
                >
                  ✏️ تعديل
                </button>
              )}
            </div>

            <div className="flex flex-col md:flex-row items-start gap-4 sm:gap-6 md:gap-8">
              {/* Avatar */}
              <div className="flex-shrink-0 relative mx-auto md:mx-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <div className="relative group">
                  {avatarPreview || profile?.avatar_url ? (
                    <img
                      src={avatarPreview || profile?.avatar_url}
                      alt="Profile"
                      className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-lg ring-4 ring-purple-100"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center text-4xl sm:text-5xl md:text-6xl font-bold text-white shadow-lg ring-4 ring-purple-100" style={{ background: 'linear-gradient(135deg, #6236FF, #FF219D)' }}>
                      {profile?.name?.charAt(0) || 'م'}
                    </div>
                  )}
                  {editMode && (
                    <>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition transform hover:scale-110"
                        title="تغيير الصورة"
                      >
                        <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      {(avatarPreview || profile?.avatar_url) && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="absolute top-0 left-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition transform hover:scale-110 text-xs sm:text-sm"
                          title="حذف الصورة"
                        >
                          ✕
                        </button>
                      )}
                    </>
                  )}
                </div>
                {editMode && (
                  <div className="mt-2 sm:mt-3 text-center">
                    <p className="text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-2">انقر على الكاميرا للتغيير</p>
                    <p className="text-[9px] sm:text-xs text-gray-400">JPG, PNG, WEBP (أقل من 5MB)</p>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 w-full space-y-4 sm:space-y-6">
                {/* الصف الأول: الاسم + العملة */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">الاسم الكامل</label>
                    {editMode ? (
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        autoComplete="name"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    ) : (
                      <p className="text-base sm:text-lg font-semibold text-gray-800">{profile?.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">العملة 💱</label>
                    <div className="flex items-center h-[42px] sm:h-[46px]">
                      <CurrencySelector />
                    </div>
                  </div>
                </div>

                {/* الصف الثاني: البريد الإلكتروني + رقم الهاتف */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">البريد الإلكتروني</label>
                    <p className="text-sm sm:text-base md:text-lg text-gray-800 break-all">{profile?.email}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-1">لا يمكن تعديل البريد الإلكتروني</p>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">رقم الهاتف</label>
                    {editMode ? (
                      <CountryPhoneInput
                        value={phone}
                        onChange={setPhone}
                        placeholder="رقم الهاتف"
                        required={false}
                        label=""
                      />
                    ) : (
                      <p className="text-base sm:text-lg text-gray-800">{profile?.phone || 'غير محدد'}</p>
                    )}
                  </div>
                </div>

                {/* نوع الحساب */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1.5 sm:mb-2">نوع الحساب</label>
                  <span className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold" style={{ 
                    background: 'linear-gradient(90deg, #6236FF, #FF219D)',
                    color: 'white'
                  }}>
                    {profile?.role ? getRoleLabel(profile.role) : '👤 عميل'}
                  </span>
                </div>

                {editMode && (
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
                    <button
                      onClick={handleUpdateProfile}
                      className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base text-white hover:opacity-90 transition shadow-lg hover:shadow-xl transform hover:scale-105"
                      style={{ background: 'linear-gradient(90deg, #00d084, #00a86b)' }}
                    >
                      ✅ حفظ التغييرات
                    </button>
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setAvatarFile(null);
                        setAvatarPreview(null);
                      }}
                      className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-300 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base text-gray-700 hover:bg-gray-400 transition"
                    >
                      ❌ إلغاء
                    </button>
                  </div>
                )}
                
                {/* Image Preview Notification */}
                {avatarFile && editMode && (
                  <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl">
                    <p className="text-xs sm:text-sm text-blue-800 font-medium">
                      📸 صورة جديدة محددة: {avatarFile.name}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      الحجم: {(avatarFile.size / 1024).toFixed(2)} KB - اضغط &quot;حفظ التغييرات&quot; لتطبيقها
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Password Change Section */}
          <div className="backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 border border-gray-200" style={{ background: 'rgba(255, 255, 255, 0.95)' }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">🔐 الأمان وكلمة المرور</h2>
              {!showPasswordChange && (
                <button
                  onClick={() => setShowPasswordChange(true)}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 rounded-xl font-medium text-sm sm:text-base text-white hover:opacity-90 transition"
                  style={{ background: 'linear-gradient(90deg, #6236FF, #FF219D)' }}
                >
                  🔑 تغيير كلمة المرور
                </button>
              )}
            </div>

            {showPasswordChange && (
              <div className="space-y-3 sm:space-y-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border-2 border-purple-200">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">كلمة المرور الحالية</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور الحالية"
                    autoComplete="current-password"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">كلمة المرور الجديدة</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور الجديدة (6 أحرف على الأقل)"
                    autoComplete="new-password"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">تأكيد كلمة المرور الجديدة</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="أعد إدخال كلمة المرور الجديدة"
                    autoComplete="new-password"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                  <button
                    onClick={handleChangePassword}
                    className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base text-white hover:opacity-90 transition shadow-lg hover:shadow-xl transform hover:scale-105"
                    style={{ background: 'linear-gradient(90deg, #00d084, #00a86b)' }}
                  >
                    ✅ تحديث كلمة المرور
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordChange(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-300 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base text-gray-700 hover:bg-gray-400 transition"
                  >
                    ❌ إلغاء
                  </button>
                </div>

                <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs sm:text-sm text-blue-800 font-medium mb-2">💡 نصائح لكلمة مرور قوية:</p>
                  <ul className="text-[10px] sm:text-xs text-blue-700 space-y-1 mr-4">
                    <li>• استخدم 6 أحرف على الأقل</li>
                    <li>• اخلط بين الأحرف الكبيرة والصغيرة</li>
                    <li>• أضف أرقام ورموز خاصة</li>
                    <li>• لا تستخدم كلمات مرور سهلة التخمين</li>
                  </ul>
                </div>
              </div>
            )}

            {!showPasswordChange && (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-3xl">🔒</span>
                </div>
                <p className="text-gray-600">حسابك محمي بكلمة مرور آمنة</p>
                <p className="text-sm text-gray-500 mt-2">قم بتحديث كلمة المرور بشكل دوري لحماية حسابك</p>
              </div>
            )}
          </div>

          {/* Loyalty Points Card */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-bold text-gray-800">نقاط الولاء 🎁</h2>
              <span className="text-sm text-gray-500 bg-purple-100 px-3 py-1 rounded-full">
                برنامج المكافآت
              </span>
            </div>
            <LoyaltyCard />
          </div>

          {/* Addresses Section - مدير المواقع المتعدد */}
          <div className="backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-gray-200" style={{ background: 'rgba(255, 255, 255, 0.95)' }}>
            {profile && <LocationsManager userId={profile.id} />}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

