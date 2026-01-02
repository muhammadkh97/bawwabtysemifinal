'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DollarSign, TrendingUp, Calendar, CreditCard, Zap } from 'lucide-react';

export default function EarningsPage() {
  const router = useRouter();
  // Using supabase from lib/supabase
  
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState({
    total: 0,
    today: 0,
    week: 0,
    month: 0,
    count: 0
  });

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: driverData } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!driverData) return;

      const { data: ordersData } = await supabase
        .from('orders')
        .select('delivery_fee, created_at')
        .eq('driver_id', driverData.id)
        .eq('status', 'delivered');

      if (ordersData) {
        const now = new Date();
        const today = new Date(now.setHours(0, 0, 0, 0));
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        let total = 0, todayTotal = 0, weekTotal = 0, monthTotal = 0;

        ordersData.forEach((o: any) => {
          const fee = o.delivery_fee || 0;
          const date = new Date(o.created_at);
          
          total += fee;
          if (date >= today) todayTotal += fee;
          if (date >= weekAgo) weekTotal += fee;
          if (date >= monthStart) monthTotal += fee;
        });

        setEarnings({
          total,
          today: todayTotal,
          week: weekTotal,
          month: monthTotal,
          count: ordersData.length
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري تحميل بيانات الأرباح...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="w-8 h-8 text-green-600 dark:text-green-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              الأرباح والإيرادات
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            تتبع أرباحك من التوصيلات والعمولات
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 uppercase font-semibold mb-1">
                  إجمالي الأرباح
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {earnings.total.toFixed(2)} ر.س
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  من {earnings.count} توصيل
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900 dark:to-purple-800 p-4 rounded-full">
                <DollarSign className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 uppercase font-semibold mb-1">
                  أرباح اليوم
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {earnings.today.toFixed(2)} ر.س
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  ✅ محدث الآن
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900 dark:to-green-800 p-4 rounded-full">
                <Zap className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 uppercase font-semibold mb-1">
                  أرباح الأسبوع
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {earnings.week.toFixed(2)} ر.س
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  آخر 7 أيام
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900 dark:to-blue-800 p-4 rounded-full">
                <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 uppercase font-semibold mb-1">
                  أرباح الشهر
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {earnings.month.toFixed(2)} ر.س
                </p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                  هذا الشهر
                </p>
              </div>
              <div className="bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900 dark:to-indigo-800 p-4 rounded-full">
                <TrendingUp className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Section */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              ملخص الإحصائيات
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">إجمالي التوصيلات</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{earnings.count}</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">متوسط لكل توصيل</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {earnings.count > 0 ? (earnings.total / earnings.count).toFixed(2) : '0'} ر.س
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">متوسط يومي</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{earnings.today.toFixed(2)} ر.س</p>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">متوسط أسبوعي</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {(earnings.week / 7).toFixed(2)} ر.س
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
