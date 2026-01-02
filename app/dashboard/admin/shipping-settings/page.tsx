'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Truck, Save, DollarSign, Gift, RefreshCw } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

export default function ShippingSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [settings, setSettings] = useState({
    base_fee: 20,
    free_shipping_threshold: 200,
    is_free: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shipping_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          base_fee: data.base_fee || 20,
          free_shipping_threshold: data.free_shipping_threshold || 200,
          is_free: data.is_free || false,
        });
      }
    } catch (error: any) {
      console.error('Error fetching shipping settings:', error);
      setMessage({ type: 'error', text: 'فشل جلب إعدادات الشحن' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // التحقق من وجود سجل
      const { data: existingData } = await supabase
        .from('shipping_settings')
        .select('id')
        .single();

      let error;
      if (existingData) {
        // تحديث السجل الموجود
        const result = await supabase
          .from('shipping_settings')
          .update({
            base_fee: settings.base_fee,
            free_shipping_threshold: settings.free_shipping_threshold,
            is_free: settings.is_free,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingData.id);
        error = result.error;
      } else {
        // إنشاء سجل جديد
        const result = await supabase
          .from('shipping_settings')
          .insert([{
            base_fee: settings.base_fee,
            free_shipping_threshold: settings.free_shipping_threshold,
            is_free: settings.is_free,
          }]);
        error = result.error;
      }

      if (error) throw error;

      setMessage({ type: 'success', text: '✅ تم حفظ الإعدادات بنجاح!' });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error saving shipping settings:', error);
      setMessage({ type: 'error', text: `❌ فشل حفظ الإعدادات: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  const presets = [
    {
      name: 'شحن مجاني للكل',
      icon: <Gift className="w-5 h-5" />,
      apply: () => setSettings({ ...settings, is_free: true }),
    },
    {
      name: 'تفعيل رسوم الشحن',
      icon: <Truck className="w-5 h-5" />,
      apply: () => setSettings({ ...settings, is_free: false }),
    },
    {
      name: 'إعدادات افتراضية',
      icon: <RefreshCw className="w-5 h-5" />,
      apply: () => setSettings({ base_fee: 20, free_shipping_threshold: 200, is_free: false }),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">إعدادات الشحن</h1>
                <p className="text-gray-500">إدارة رسوم الشحن والتوصيل</p>
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-xl border-2 ${
                message.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Quick Presets */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">🚀 إعدادات سريعة</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {presets.map((preset, index) => (
                <button
                  key={index}
                  onClick={preset.apply}
                  className="p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all text-right"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                      {preset.icon}
                    </div>
                    <span className="font-medium text-gray-900">{preset.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Settings */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            {loading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">جاري التحميل...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Free Shipping Toggle */}
                <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Gift className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">شحن مجاني للجميع</h3>
                        <p className="text-sm text-gray-600">تفعيل الشحن المجاني لجميع الطلبات</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.is_free}
                        onChange={(e) => setSettings({ ...settings, is_free: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-16 h-8 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-8 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-600 peer-checked:to-pink-600"></div>
                    </label>
                  </div>
                  {settings.is_free && (
                    <div className="mt-4 p-4 bg-white/50 rounded-lg">
                      <p className="text-sm font-medium text-purple-700">
                        🎉 الشحن مجاني حالياً لجميع العملاء! سيتم تجاهل رسوم الشحن الأساسية.
                      </p>
                    </div>
                  )}
                </div>

                {/* Base Shipping Fee */}
                <div className={settings.is_free ? 'opacity-50 pointer-events-none' : ''}>
                  <label className="block text-gray-900 font-bold mb-3 text-lg">
                    <DollarSign className="inline w-5 h-5 ml-2" />
                    رسوم الشحن الأساسية
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={settings.base_fee}
                      onChange={(e) => setSettings({ ...settings, base_fee: Number(e.target.value) })}
                      disabled={settings.is_free}
                      className="w-full px-6 py-4 text-2xl font-bold border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all"
                      min="0"
                      step="5"
                    />
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">
                      ₪
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    💡 سيتم تحويل المبلغ تلقائياً إلى العملة المختارة (دينار، ريال، جنيه)
                  </p>
                </div>

                {/* Free Shipping Threshold */}
                <div className={settings.is_free ? 'opacity-50 pointer-events-none' : ''}>
                  <label className="block text-gray-900 font-bold mb-3 text-lg">
                    <Gift className="inline w-5 h-5 ml-2" />
                    حد الشحن المجاني
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={settings.free_shipping_threshold}
                      onChange={(e) => setSettings({ ...settings, free_shipping_threshold: Number(e.target.value) })}
                      disabled={settings.is_free}
                      className="w-full px-6 py-4 text-2xl font-bold border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all"
                      min="0"
                      step="10"
                    />
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">
                      ₪
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-gray-600 bg-green-50 p-3 rounded-lg border border-green-200">
                    🎁 الطلبات التي تزيد عن هذا المبلغ ستحصل على شحن مجاني تلقائياً
                  </p>
                </div>

                {/* Current Settings Preview */}
                <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">📊 معاينة الإعدادات الحالية</h3>
                  <div className="space-y-3">
                    {settings.is_free ? (
                      <div className="flex items-center gap-3 p-4 bg-green-100 rounded-lg">
                        <Gift className="w-6 h-6 text-green-600" />
                        <span className="font-bold text-green-800 text-lg">
                          🎉 الشحن مجاني لجميع الطلبات
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                          <span className="text-gray-700">رسوم الشحن الأساسية:</span>
                          <span className="font-bold text-blue-600 text-xl">{settings.base_fee} ₪</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                          <span className="text-gray-700">شحن مجاني للطلبات فوق:</span>
                          <span className="font-bold text-green-600 text-xl">{settings.free_shipping_threshold} ₪</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {saving ? (
                    <>
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="w-6 h-6" />
                      حفظ الإعدادات
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
