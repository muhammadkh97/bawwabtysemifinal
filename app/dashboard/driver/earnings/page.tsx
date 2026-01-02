'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import FuturisticStatCard from '@/components/dashboard/FuturisticStatCard';
import { DollarSign, TrendingUp, Calendar, Package } from 'lucide-react';

export default function EarningsPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
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
        router.push('/auth/login');
        return;
      }

      // Get user name
      const { data: userData } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single();
      
      if (userData) {
        setUserName(userData.name || 'مندوب التوصيل');
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
      <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-[#0A0515]">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'إجمالي الأرباح',
      value: `${earnings.total.toFixed(2)} ر.س`,
      icon: DollarSign,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      title: 'أرباح اليوم',
      value: `${earnings.today.toFixed(2)} ر.س`,
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      title: 'أرباح الأسبوع',
      value: `${earnings.week.toFixed(2)} ر.س`,
      icon: Calendar,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'أرباح الشهر',
      value: `${earnings.month.toFixed(2)} ر.س`,
      icon: Calendar,
      gradient: 'from-indigo-500 to-purple-500',
    },
    {
      title: 'إجمالي التوصيلات',
      value: earnings.count.toLocaleString('ar-SA'),
      icon: Package,
      gradient: 'from-orange-500 to-red-500',
    },
    {
      title: 'متوسط الربح لكل توصيل',
      value: earnings.count > 0 ? `${(earnings.total / earnings.count).toFixed(2)} ر.س` : '0 ر.س',
      icon: DollarSign,
      gradient: 'from-yellow-500 to-orange-500',
    },
  ];

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
            <h1 className="text-4xl font-bold text-white mb-2">الأرباح والمحفظة</h1>
            <p className="text-purple-300 text-lg">تتبع أرباحك من التوصيلات</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 rounded-2xl p-6"
            style={{
              background: 'rgba(15, 10, 30, 0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(98, 54, 255, 0.3)',
            }}
          >
            <h2 className="text-2xl font-bold text-white mb-4">نصائح لزيادة أرباحك</h2>
            <div className="space-y-3 text-purple-200">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
                <p>قبول المزيد من الطلبات في أوقات الذروة (الغداء والعشاء)</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
                <p>حافظ على تقييم عالٍ لتحصل على أولوية في الطلبات</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
                <p>كن نشطاً في المناطق ذات الطلب المرتفع</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
                <p>أكمل التوصيلات بسرعة للحصول على مكافآت إضافية</p>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
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
