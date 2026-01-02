'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { User, Phone, Save, Settings as SettingsIcon, Car, FileText, CheckCircle } from 'lucide-react';

export default function DriverSettingsPage() {
  const router = useRouter();
  // Using supabase from lib/supabase
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [driverData, setDriverData] = useState({
    name: '',
    phone: '',
    vehicle_type: '',
    vehicle_number: '',
    license_number: ''
  });

  useEffect(() => {
    loadDriverData();
  }, []);

  const loadDriverData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('name, phone')
        .eq('id', user.id)
        .single();

      const { data: driverInfo } = await supabase
        .from('drivers')
        .select('vehicle_type, vehicle_number, license_number')
        .eq('user_id', user.id)
        .single();

      if (userData) {
        setDriverData({
          name: userData.name || '',
          phone: userData.phone || '',
          vehicle_type: driverInfo?.vehicle_type || '',
          vehicle_number: driverInfo?.vehicle_number || '',
          license_number: driverInfo?.license_number || ''
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('users')
        .update({
          name: driverData.name,
          phone: driverData.phone
        })
        .eq('id', user.id);

      await supabase
        .from('drivers')
        .update({
          vehicle_type: driverData.vehicle_type,
          vehicle_number: driverData.vehicle_number,
          license_number: driverData.license_number
        })
        .eq('user_id', user.id);

      toast.success('✅ تم حفظ التغييرات بنجاح!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('حدث خطأ في حفظ التغييرات');
    }
    
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل الإعدادات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              إعدادات الحساب
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            أدر بيانات حسابك الشخصية وبيانات المركبة
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Personal Information Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              المعلومات الشخصية
            </h2>
          </div>
          <div className="p-6 space-y-5">
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                الاسم الكامل
              </label>
              <div className="relative">
                <User className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={driverData.name}
                  onChange={(e) => setDriverData({ ...driverData, name: e.target.value })}
                  className="w-full pr-10 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="أدخل اسمك الكامل"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                رقم الهاتف
              </label>
              <div className="relative">
                <Phone className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={driverData.phone}
                  onChange={(e) => setDriverData({ ...driverData, phone: e.target.value })}
                  className="w-full pr-10 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="05xxxxxxxx"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Information Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Car className="w-5 h-5" />
              معلومات المركبة
            </h2>
          </div>
          <div className="p-6 space-y-5">

          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                نوع المركبة
              </label>
              <div className="relative">
                <Car className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                <select
                  value={driverData.vehicle_type}
                  onChange={(e) => setDriverData({ ...driverData, vehicle_type: e.target.value })}
                  className="w-full pr-10 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none"
                >
                  <option value="">اختر نوع المركبة</option>
                  <option value="car">🚗 سيارة</option>
                  <option value="motorcycle">🏍️ دراجة نارية</option>
                  <option value="bicycle">🚴 دراجة هوائية</option>
                  <option value="van">🚐 فان</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                رقم اللوحة
              </label>
              <div className="relative">
                <FileText className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={driverData.vehicle_number}
                  onChange={(e) => setDriverData({ ...driverData, vehicle_number: e.target.value })}
                  className="w-full pr-10 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="ABC-1234"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                رقم رخصة القيادة
              </label>
              <div className="relative">
                <FileText className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={driverData.license_number}
                  onChange={(e) => setDriverData({ ...driverData, license_number: e.target.value })}
                  className="w-full pr-10 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="أدخل رقم الرخصة"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-8 py-3 rounded-lg font-bold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl ${
              saving
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
            }`}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                حفظ التغييرات
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
              disabled={saving}
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
            >
              <Save className="w-5 h-5" />
              {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
