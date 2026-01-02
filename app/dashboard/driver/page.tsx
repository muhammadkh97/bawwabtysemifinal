'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import FuturisticStatCard from '@/components/dashboard/FuturisticStatCard';
import { Package, DollarSign, Clock, TrendingUp, MapPin, Star, Truck, CheckCircle } from 'lucide-react';

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
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('يرجى تسجيل الدخول أولاً');
        router.push('/auth/login');
        return;
      }

      // Get user details
      const { data: userData } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single();
      
      if (userData) {
        setUserName(userData.name || 'مندوب التوصيل');
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

  const statsCards = [
    {
      title: 'إجمالي التوصيلات',
      value: stats.total_deliveries.toLocaleString('ar-SA'),
      icon: Package,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'التوصيلات المعلقة',
      value: stats.pending_deliveries.toLocaleString('ar-SA'),
      icon: Clock,
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      title: 'المكتملة اليوم',
      value: stats.completed_today.toLocaleString('ar-SA'),
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      title: 'إجمالي الأرباح',
      value: `${stats.total_earnings.toFixed(2)} ر.س`,
      icon: DollarSign,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      title: 'أرباح اليوم',
      value: `${stats.today_earnings.toFixed(2)} ر.س`,
      icon: TrendingUp,
      gradient: 'from-indigo-500 to-purple-500',
    },
    {
      title: 'متوسط التقييم',
      value: `${stats.average_rating.toFixed(1)} ⭐`,
      icon: Star,
      gradient: 'from-amber-500 to-orange-500',
    },
  ];

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
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-2">لوحة التحكم</h1>
            <p className="text-purple-300 text-lg">مرحباً بك في لوحة تحكم مندوب التوصيل</p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {statsCards.map((stat, index) => (
              <FuturisticStatCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                gradient={stat.gradient}
                delay={index * 0.1}
              />
            ))}
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl sm:rounded-3xl p-6 sm:p-8"
            style={{
              background: 'rgba(15, 10, 30, 0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(98, 54, 255, 0.3)',
            }}
          >
            <h2 className="text-2xl font-bold text-white mb-6">إجراءات سريعة</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.button
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/dashboard/driver/available')}
                className="group relative overflow-hidden rounded-xl p-6 transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right flex-1">
                    <p className="font-bold text-white text-lg mb-1">الطلبات المتاحة</p>
                    <p className="text-sm text-purple-300">عرض الطلبات الجديدة</p>
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/dashboard/driver/my-orders')}
                className="group relative overflow-hidden rounded-xl p-6 transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.05) 100%)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right flex-1">
                    <p className="font-bold text-white text-lg mb-1">طلباتي</p>
                    <p className="text-sm text-purple-300">عرض طلباتي الحالية</p>
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/dashboard/driver/earnings')}
                className="group relative overflow-hidden rounded-xl p-6 transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(147, 51, 234, 0.05) 100%)',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right flex-1">
                    <p className="font-bold text-white text-lg mb-1">الأرباح</p>
                    <p className="text-sm text-purple-300">عرض تفاصيل الأرباح</p>
                  </div>
                </div>
              </motion.button>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
