'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { User, Phone, Save } from 'lucide-react';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          الإعدادات
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                الاسم
              </label>
              <div className="relative">
                <User className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={driverData.name}
                  onChange={(e) => setDriverData({ ...driverData, name: e.target.value })}
                  className="w-full pr-10 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                رقم الهاتف
              </label>
              <div className="relative">
                <Phone className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={driverData.phone}
                  onChange={(e) => setDriverData({ ...driverData, phone: e.target.value })}
                  className="w-full pr-10 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                نوع المركبة
              </label>
              <select
                value={driverData.vehicle_type}
                onChange={(e) => setDriverData({ ...driverData, vehicle_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="">اختر نوع المركبة</option>
                <option value="car">سيارة</option>
                <option value="motorcycle">دراجة نارية</option>
                <option value="bicycle">دراجة هوائية</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                رقم اللوحة
              </label>
              <input
                type="text"
                value={driverData.vehicle_number}
                onChange={(e) => setDriverData({ ...driverData, vehicle_number: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                رقم الرخصة
              </label>
              <input
                type="text"
                value={driverData.license_number}
                onChange={(e) => setDriverData({ ...driverData, license_number: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <button
              onClick={handleSave}
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
