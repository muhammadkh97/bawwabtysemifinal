'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import FuturisticStatCard from '@/components/dashboard/FuturisticStatCard';
import FuturisticUserCard from '@/components/dashboard/FuturisticUserCard';
import FuturisticProductCard from '@/components/dashboard/FuturisticProductCard';
import { SalesChart, OrdersStatusChart, TopProductsChart } from '@/components/dashboard/AnalyticsCharts';
import { supabase } from '@/lib/supabase';
import {
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Package,
  Store,
  Truck,
  Star,
} from 'lucide-react';

function AdminDashboardContent() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    {
      title: 'إجمالي المستخدمين',
      value: '0',
      icon: Users,
      trend: { value: 0, isPositive: true },
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'إجمالي الطلبات',
      value: '0',
      icon: ShoppingCart,
      trend: { value: 0, isPositive: true },
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      title: 'إجمالي المبيعات',
      value: '0 ر.س',
      icon: DollarSign,
      trend: { value: 0, isPositive: true },
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      title: 'معدل النمو',
      value: '+0%',
      icon: TrendingUp,
      trend: { value: 0, isPositive: true },
      gradient: 'from-orange-500 to-red-500',
    },
  ]);

  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [quickStats, setQuickStats] = useState([
    { label: 'تجار نشطين', value: '0', icon: Store, color: 'from-emerald-500 to-teal-500' },
    { label: 'سائقين متاحين', value: '0', icon: Truck, color: 'from-blue-500 to-cyan-500' },
    { label: 'منتجات مميزة', value: '0', icon: Package, color: 'from-purple-500 to-pink-500' },
    { label: 'تقييم عام', value: '0', icon: Star, color: 'from-yellow-500 to-orange-500' },
  ]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // استدعاء دالة الـ RPC المجمّعة لتقليل الاستعلامات وتفادي مشاكل RLS
      const { data: adminStats, error: statsError } = await supabase.rpc('get_admin_dashboard_stats');
      if (statsError) throw statsError;

      const statsRow = (adminStats && adminStats[0]) || {};
      
      // 🔍 Debug: طباعة البيانات للتشخيص
      console.log('📊 Dashboard Stats:', statsRow);
      console.log('💰 Total Revenue:', statsRow.total_revenue);

      // تحديث الكروت الرئيسية
      setStats([
        {
          title: 'إجمالي المستخدمين',
          value: Number(statsRow.total_users || 0).toLocaleString('ar-SA'),
          icon: Users,
          trend: { value: 0, isPositive: true },
          gradient: 'from-blue-500 to-cyan-500',
        },
        {
          title: 'إجمالي الطلبات',
          value: Number(statsRow.total_orders || 0).toLocaleString('ar-SA'),
          icon: ShoppingCart,
          trend: { value: 0, isPositive: true },
          gradient: 'from-purple-500 to-pink-500',
        },
        {
          title: 'إجمالي المبيعات',
          value: `${Number(statsRow.total_revenue || 0).toLocaleString('ar-SA')} ر.س`,
          icon: DollarSign,
          trend: { value: 0, isPositive: true },
          gradient: 'from-emerald-500 to-teal-500',
        },
        {
          title: 'متوسط قيمة الطلب',
          value: `${Number(statsRow.avg_order_value || 0).toFixed(1)} ر.س`,
          icon: TrendingUp,
          trend: { value: 0, isPositive: true },
          gradient: 'from-orange-500 to-red-500',
        },
      ]);

      // إحصائيات سريعة تشمل المطاعم والدرايفرز
      setQuickStats([
        { label: 'تجار نشطين', value: Number(statsRow.total_vendors || 0).toString(), icon: Store, color: 'from-emerald-500 to-teal-500' },
        { label: 'مطاعم', value: Number(statsRow.total_restaurants || 0).toString(), icon: Store, color: 'from-pink-500 to-red-500' },
        { label: 'سائقين', value: Number(statsRow.total_drivers || 0).toString(), icon: Truck, color: 'from-blue-500 to-cyan-500' },
        { label: 'عملاء', value: Number(statsRow.total_customers || 0).toString(), icon: Users, color: 'from-yellow-500 to-orange-500' },
      ]);

      // المستخدمون الجدد (4 فقط) مع الحقول الصحيحة
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name, email, phone, user_role, created_at')
        .order('created_at', { ascending: false })
        .limit(4);

      setRecentUsers(usersData?.map(user => ({
        id: user.id,
        name: user.full_name || 'مستخدم',
        email: user.email,
        phone: user.phone || 'غير محدد',
        location: 'غير متوفر',
        role: user.user_role || 'customer',
        status: 'active' as const,
      })) || []);

      // أفضل المنتجات حسب المبيعات من order_items + products بالأعمدة الجديدة
      const { data: orderItemsData } = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          item_total,
          products (
            id,
            name,
            price,
            stock,
            category_id
          )
        `);

      if (orderItemsData) {
        const productSalesMap: { [key: string]: { product: any; sales: number; revenue: number } } = {};

        orderItemsData.forEach(item => {
          const product = item.products as any;
          if (!product) return;
          if (!productSalesMap[item.product_id]) {
            productSalesMap[item.product_id] = { product, sales: 0, revenue: 0 };
          }
          productSalesMap[item.product_id].sales += item.quantity || 0;
          productSalesMap[item.product_id].revenue += item.item_total || 0;
        });

        const sortedProducts = Object.values(productSalesMap)
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 4)
          .map(({ product, sales, revenue }) => ({
            id: product.id,
            name: product.name,
            price: product.price,
            category: product.category_id || 'عام',
            stock: product.stock,
            sales,
            revenue,
          }));

        setTopProducts(sortedProducts);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0A0515]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 dark:text-purple-300">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-[#0A0515] transition-colors duration-300">
      {/* Animated background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.2, 0.3],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, #6236FF 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            opacity: [0.3, 0.2, 0.3],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/2 -left-40 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, #FF219D 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            y: [0, 50, 0],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute bottom-20 right-1/3 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, #B621FE 0%, transparent 70%)' }}
        />
      </div>

      <FuturisticSidebar role="admin" />
      
      {/* Main Content Area */}
      <div className="md:mr-[280px] transition-all duration-300">
        <FuturisticNavbar userName="" userRole="مدير" notificationCount={0} />
        
        <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10 relative z-10 max-w-[1800px] mx-auto">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            مرحباً بك في لوحة التحكم! 👋
          </h1>
          <p className="text-purple-200">هذه نظرة عامة على أداء المنصة</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <FuturisticStatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              trend={stat.trend}
              gradient={stat.gradient}
              delay={index * 0.1}
            />
          ))}
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickStats.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ y: -5 }}
              className="relative rounded-2xl p-4 text-center"
              style={{
                background: 'rgba(15, 10, 30, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(98, 54, 255, 0.3)',
              }}
            >
              <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-white mb-1">{item.value}</p>
              <p className="text-sm text-purple-200">{item.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts Section - الرسوم البيانية */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
        >
          <SalesChart />
          <OrdersStatusChart />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mb-8"
        >
          <TopProductsChart />
        </motion.div>

        {/* Recent Users Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">المستخدمون الجدد</h2>
            <a href="/dashboard/admin/users" className="px-4 py-2 rounded-xl text-purple-300 hover:text-white transition-colors">
              عرض الكل ←
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentUsers.map((user, index) => (
              <FuturisticUserCard
                key={user.id}
                {...user}
                delay={0.9 + index * 0.1}
              />
            ))}
          </div>
        </motion.div>

        {/* Top Products Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">المنتجات الأكثر مبيعاً</h2>
            <a href="/dashboard/admin/top-products" className="px-4 py-2 rounded-xl text-purple-300 hover:text-white transition-colors">
              عرض الكل ←
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {topProducts.map((product, index) => (
              <FuturisticProductCard
                key={product.id}
                {...product}
                delay={1.3 + index * 0.1}
              />
            ))}
          </div>
        </motion.div>
        </main>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return <AdminDashboardContent />;
}

