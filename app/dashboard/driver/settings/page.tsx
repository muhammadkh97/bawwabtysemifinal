'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import { User, Phone, Save, Car, FileText } from 'lucide-react';

export default function DriverSettingsPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userName, setUserName] = useState('');
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
        router.push('/auth/login');
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
        setUserName(userData.name || 'مندوب التوصيل');
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
      setUserName(driverData.name);
    } catch (error) {
      console.error('Error:', error);
      toast.error('حدث خطأ في حفظ التغييرات');
    }
    
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-[#0A0515]">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-[#0A0515] transition-colors duration-300">
      <FuturisticSidebar role="driver" />
      
      <div className="md:mr-[280px] transition-all duration-300">
        <FuturisticNavbar userName={userName} userRole="مندوب توصيل" />
        
        <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10 relative z-10 max-w-[1800px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-2">الإعدادات</h1>
            <p className="text-purple-300 text-lg">إدارة معلومات حسابك ومركبتك</p>
          </motion.div>

          <div className="grid gap-6 max-w-3xl">
            {/* Personal Info */}
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
                <User className="w-6 h-6" />
                المعلومات الشخصية
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-purple-300 text-sm mb-2">
                    الاسم الكامل
                  </label>
                  <input
                    type="text"
                    value={driverData.name}
                    onChange={(e) => setDriverData({ ...driverData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white bg-white/5 border border-purple-500/30 focus:border-purple-500 outline-none transition"
                    placeholder="أدخل اسمك الكامل"
                  />
                </div>

                <div>
                  <label className="block text-purple-300 text-sm mb-2">
                    رقم الجوال
                  </label>
                  <input
                    type="tel"
                    value={driverData.phone}
                    onChange={(e) => setDriverData({ ...driverData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white bg-white/5 border border-purple-500/30 focus:border-purple-500 outline-none transition"
                    placeholder="+966 5xxxxxxxx"
                    dir="ltr"
                  />
                </div>
              </div>
            </motion.div>

            {/* Vehicle Info */}
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
                <Car className="w-6 h-6" />
                معلومات المركبة
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-purple-300 text-sm mb-2">
                    نوع المركبة
                  </label>
                  <select
                    value={driverData.vehicle_type}
                    onChange={(e) => setDriverData({ ...driverData, vehicle_type: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white bg-white/5 border border-purple-500/30 focus:border-purple-500 outline-none transition"
                  >
                    <option value="" className="bg-gray-800">اختر نوع المركبة</option>
                    <option value="motorcycle" className="bg-gray-800">دراجة نارية</option>
                    <option value="car" className="bg-gray-800">سيارة</option>
                    <option value="van" className="bg-gray-800">فان</option>
                    <option value="bicycle" className="bg-gray-800">دراجة هوائية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-purple-300 text-sm mb-2">
                    رقم اللوحة
                  </label>
                  <input
                    type="text"
                    value={driverData.vehicle_number}
                    onChange={(e) => setDriverData({ ...driverData, vehicle_number: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white bg-white/5 border border-purple-500/30 focus:border-purple-500 outline-none transition"
                    placeholder="ABC 1234"
                  />
                </div>

                <div>
                  <label className="block text-purple-300 text-sm mb-2">
                    رقم الرخصة
                  </label>
                  <input
                    type="text"
                    value={driverData.license_number}
                    onChange={(e) => setDriverData({ ...driverData, license_number: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-white bg-white/5 border border-purple-500/30 focus:border-purple-500 outline-none transition"
                    placeholder="رقم رخصة القيادة"
                  />
                </div>
              </div>
            </motion.div>

            {/* Save Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </motion.button>
          </div>
        </main>
      </div>
    </div>
  );
}
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
