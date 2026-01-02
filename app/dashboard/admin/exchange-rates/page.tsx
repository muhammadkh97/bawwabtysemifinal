'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import { RefreshCw, DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { 
  getLatestExchangeRates, 
  updateExchangeRatesFromAPI, 
  triggerExchangeRatesUpdate,
  getExchangeRatesAge,
  updateSingleRate
} from '@/lib/exchange-rates';
import toast from 'react-hot-toast';
import { SUPPORTED_CURRENCIES, CurrencyCode } from '@/contexts/CurrencyContextDynamic';

interface RateInfo {
  currency: string;
  rate: number;
  lastUpdated: string;
  flag: string;
  name: string;
}

export default function ExchangeRatesPage() {
  const [rates, setRates] = useState<RateInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [ageInHours, setAgeInHours] = useState<number | null>(null);
  const [editingRate, setEditingRate] = useState<string | null>(null);
  const [newRate, setNewRate] = useState<string>('');

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    try {
      setLoading(true);
      
      // جلب الأسعار من قاعدة البيانات
      const dbRates = await getLatestExchangeRates();
      
      // جلب عمر التحديث
      const age = await getExchangeRatesAge();
      if (age) {
        setLastUpdate(age.lastUpdated);
        setAgeInHours(age.ageInHours);
      }

      if (dbRates) {
        const ratesList: RateInfo[] = Object.entries(dbRates).map(([currency, info]) => ({
          currency,
          rate: info.rate,
          lastUpdated: info.lastUpdated,
          flag: SUPPORTED_CURRENCIES[currency as CurrencyCode]?.flag || '🌐',
          name: SUPPORTED_CURRENCIES[currency as CurrencyCode]?.name || currency,
        }));
        
        setRates(ratesList);
      }
    } catch (error) {
      console.error('Error loading rates:', error);
      toast.error('فشل تحميل أسعار الصرف');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFromAPI = async () => {
    try {
      setUpdating(true);
      toast.loading('جاري تحديث الأسعار من APIs عالمية...', { id: 'update-rates' });
      
      const result = await updateExchangeRatesFromAPI();
      
      if (result.success) {
        toast.success(`✅ تم تحديث ${result.count} سعر صرف بنجاح`, { id: 'update-rates' });
        await loadRates();
      } else {
        toast.error('فشل التحديث من API', { id: 'update-rates' });
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('حدث خطأ أثناء التحديث', { id: 'update-rates' });
    } finally {
      setUpdating(false);
    }
  };

  const handleTriggerEdgeFunction = async () => {
    try {
      setUpdating(true);
      toast.loading('جاري تشغيل Edge Function...', { id: 'edge-update' });
      
      const result = await triggerExchangeRatesUpdate();
      
      if (result.success) {
        toast.success('✅ تم التحديث عبر Edge Function', { id: 'edge-update' });
        await loadRates();
      } else {
        toast.error('فشل تشغيل Edge Function', { id: 'edge-update' });
      }
    } catch (error) {
      console.error('Edge Function error:', error);
      toast.error('حدث خطأ', { id: 'edge-update' });
    } finally {
      setUpdating(false);
    }
  };

  const handleEditRate = (currency: string, currentRate: number) => {
    setEditingRate(currency);
    setNewRate(currentRate.toString());
  };

  const handleSaveRate = async (currency: string) => {
    try {
      const rate = parseFloat(newRate);
      if (isNaN(rate) || rate <= 0) {
        toast.error('السعر غير صحيح');
        return;
      }

      toast.loading('جاري الحفظ...', { id: 'save-rate' });
      
      const result = await updateSingleRate(currency, rate, 'Manual Admin Update');
      
      if (result.success) {
        toast.success('✅ تم تحديث السعر', { id: 'save-rate' });
        setEditingRate(null);
        await loadRates();
      } else {
        toast.error('فشل الحفظ', { id: 'save-rate' });
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('حدث خطأ', { id: 'save-rate' });
    }
  };

  const getStatusColor = () => {
    if (!ageInHours) return 'text-gray-400';
    if (ageInHours < 12) return 'text-green-400';
    if (ageInHours < 24) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-[#0A0515] transition-colors duration-300">
      <FuturisticSidebar role="admin" />
      
      <div className="md:mr-[280px] transition-all duration-300">
        <FuturisticNavbar userName="المدير" userRole="مدير" />
        
        <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10 relative z-10 max-w-[1800px] mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                  <DollarSign className="w-10 h-10" />
                  إدارة أسعار الصرف
                </h1>
                <p className="text-purple-300 text-lg">
                  تحديث وإدارة أسعار العملات من APIs عالمية
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleUpdateFromAPI}
                  disabled={updating}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-5 h-5 ${updating ? 'animate-spin' : ''}`} />
                  تحديث من API
                </button>

                <button
                  onClick={handleTriggerEdgeFunction}
                  disabled={updating}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl text-white font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrendingUp className="w-5 h-5" />
                  Edge Function
                </button>
              </div>
            </div>
          </motion.div>

          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6 mb-6"
            style={{
              background: 'rgba(15, 10, 30, 0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(98, 54, 255, 0.3)',
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-500/20">
                  <Clock className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <div className="text-gray-400 text-sm">آخر تحديث</div>
                  <div className={`text-lg font-bold ${getStatusColor()}`}>
                    {lastUpdate ? lastUpdate.toLocaleString('ar') : 'غير متوفر'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/20">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <div className="text-gray-400 text-sm">العمر</div>
                  <div className={`text-lg font-bold ${getStatusColor()}`}>
                    {ageInHours !== null ? `${ageInHours.toFixed(1)} ساعة` : 'غير متوفر'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500/20">
                  {ageInHours && ageInHours < 24 ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  )}
                </div>
                <div>
                  <div className="text-gray-400 text-sm">الحالة</div>
                  <div className={`text-lg font-bold ${ageInHours && ageInHours < 24 ? 'text-green-400' : 'text-red-400'}`}>
                    {ageInHours && ageInHours < 24 ? 'محدّثة' : 'تحتاج تحديث'}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Rates Table */}
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
            <h3 className="text-2xl font-bold text-white mb-6">أسعار العملات الحالية</h3>

            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-400">جاري تحميل الأسعار...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-purple-500/30">
                      <th className="text-right py-4 px-4 text-purple-300 font-bold">العملة</th>
                      <th className="text-right py-4 px-4 text-purple-300 font-bold">الاسم</th>
                      <th className="text-right py-4 px-4 text-purple-300 font-bold">السعر (مقابل SAR)</th>
                      <th className="text-right py-4 px-4 text-purple-300 font-bold">آخر تحديث</th>
                      <th className="text-center py-4 px-4 text-purple-300 font-bold">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rates.map((rate) => (
                      <tr key={rate.currency} className="border-b border-purple-500/10 hover:bg-purple-500/5 transition">
                        <td className="py-4 px-4">
                          <span className="text-3xl">{rate.flag}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-white">{rate.name}</div>
                          <div className="text-sm text-gray-400">{rate.currency}</div>
                        </td>
                        <td className="py-4 px-4">
                          {editingRate === rate.currency ? (
                            <input
                              type="number"
                              step="0.000001"
                              value={newRate}
                              onChange={(e) => setNewRate(e.target.value)}
                              className="px-3 py-2 rounded-lg bg-white/5 border border-purple-500/30 text-white w-32"
                              autoFocus
                            />
                          ) : (
                            <span className="text-xl font-bold text-white">{rate.rate.toFixed(6)}</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-gray-400 text-sm">
                          {new Date(rate.lastUpdated).toLocaleString('ar')}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-2">
                            {editingRate === rate.currency ? (
                              <>
                                <button
                                  onClick={() => handleSaveRate(rate.currency)}
                                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm font-bold transition"
                                >
                                  حفظ
                                </button>
                                <button
                                  onClick={() => setEditingRate(null)}
                                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white text-sm font-bold transition"
                                >
                                  إلغاء
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleEditRate(rate.currency, rate.rate)}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm font-bold transition"
                              >
                                تعديل
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 rounded-2xl p-6"
            style={{
              background: 'rgba(15, 10, 30, 0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(98, 54, 255, 0.3)',
            }}
          >
            <h4 className="text-xl font-bold text-white mb-4">📋 معلومات مهمة</h4>
            <ul className="space-y-2 text-gray-300">
              <li>• الأسعار تُجلب من APIs عالمية موثوقة (ExchangeRate-API, Frankfurter, Currency API)</li>
              <li>• يتم التحديث التلقائي كل 24 ساعة</li>
              <li>• يمكنك تحديث الأسعار يدوياً في أي وقت</li>
              <li>• جميع الأسعار بالنسبة للريال السعودي (SAR)</li>
              <li>• التغييرات تؤثر فوراً على جميع المستخدمين</li>
            </ul>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
