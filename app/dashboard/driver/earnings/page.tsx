'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DollarSign, TrendingUp, Calendar } from 'lucide-react';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          الأرباح
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  إجمالي الأرباح
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {earnings.total.toFixed(2)} ر.س
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  أرباح اليوم
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {earnings.today.toFixed(2)} ر.س
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  أرباح الأسبوع
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {earnings.week.toFixed(2)} ر.س
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  أرباح الشهر
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {earnings.month.toFixed(2)} ر.س
                </p>
              </div>
              <div className="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-full">
                <Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  التوصيلات المكتملة
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {earnings.count}
                </p>
              </div>
              <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
