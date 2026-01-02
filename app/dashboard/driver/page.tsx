'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { Package, DollarSign, Clock, TrendingUp, MapPin } from 'lucide-react';

interface DashboardStats {
  total_deliveries: number;
  pending_deliveries: number;
  completed_today: number;
  total_earnings: number;
  today_earnings: number;
  average_rating: number;
}

export default function DriverDashboard() {
  const router = useRouter();
  // Using supabase from lib/supabase
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    total_deliveries: 0,
    pending_deliveries: 0,
    completed_today: 0,
    total_earnings: 0,
    today_earnings: 0,
    average_rating: 0
  });
  const [driverId, setDriverId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('يرجى تسجيل الدخول أولاً');
        router.push('/login');
        return;
      }

      // Get driver ID
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (driverError || !driverData) {
        toast.error('⚠️ يجب أن تكون مندوب توصيل');
        router.push('/dashboard');
        return;
      }

      setDriverId(driverData.id);

      // Get dashboard stats using RPC function
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_driver_dashboard_stats', { p_driver_id: driverData.id });

      if (statsError) {
        console.error('Error loading stats:', statsError);
        toast.error('فشل تحميل الإحصائيات');
      } else if (statsData && statsData.length > 0) {
        setStats(statsData[0]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('حدث خطأ غير متوقع');
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            لوحة التحكم
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            مرحباً بك في لوحة تحكم مندوب التوصيل
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Deliveries */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  إجمالي التوصيلات
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.total_deliveries}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Pending Deliveries */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  التوصيلات المعلقة
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.pending_deliveries}
                </p>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          {/* Completed Today */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  المكتملة اليوم
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.completed_today}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          {/* Total Earnings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  إجمالي الأرباح
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.total_earnings.toFixed(2)} ر.س
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          {/* Today Earnings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  أرباح اليوم
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.today_earnings.toFixed(2)} ر.س
                </p>
              </div>
              <div className="bg-indigo-100 dark:bg-indigo-900 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>

          {/* Average Rating */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  متوسط التقييم
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.average_rating.toFixed(1)} ⭐
                </p>
              </div>
              <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            إجراءات سريعة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/dashboard/driver/available')}
              className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <div className="text-right">
                <p className="font-medium text-gray-900 dark:text-white">
                  الطلبات المتاحة
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  عرض الطلبات الجديدة
                </p>
              </div>
            </button>

            <button
              onClick={() => router.push('/dashboard/driver/my-orders')}
              className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
              <div className="text-right">
                <p className="font-medium text-gray-900 dark:text-white">
                  طلباتي
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  عرض طلباتي الحالية
                </p>
              </div>
            </button>

            <button
              onClick={() => router.push('/dashboard/driver/earnings')}
              className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <div className="text-right">
                <p className="font-medium text-gray-900 dark:text-white">
                  الأرباح
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  عرض تفاصيل الأرباح
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
