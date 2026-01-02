'use client';

import { useState, useEffect } from 'react';

import { motion } from 'framer-motion';
import Link from 'next/link';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import FuturisticStatCard from '@/components/dashboard/FuturisticStatCard';
import FuturisticProductCard from '@/components/dashboard/FuturisticProductCard';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import {
  Package,
  ShoppingCart,
  DollarSign,
  Star,
  TrendingUp,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  sales?: number;
}

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  activeProducts: number;
  averageRating: number;
  revenueTrend?: number;
  ordersTrend?: number;
}

function VendorDashboardContent() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalRevenue: 0,
    activeProducts: 0,
    averageRating: 0,
    revenueTrend: 0,
    ordersTrend: 0,
  });
  const [user, setUser] = useState<any>(null);
  const { userId, userFullName } = useAuth();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    if (userId) {
      fetchDashboardData();
    }
  }, [userId]);

  const fetchDashboardData = async () => {
    if (!userId) return;
    
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('id, full_name, user_role')
        .eq('id', userId)
        .single();

      if (userData && userData.user_role !== 'vendor') {
        // إذا لم يكن بائعاً، قد يكون مطعماً أو مديراً، لكن هذه الصفحة مخصصة للبائعين
        console.warn('User is not a vendor:', userData.user_role);
      }

      setUser(userData);

      // جلب سجل البائع باستخدام user_id
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (vendorError || !vendorData) {
        console.error('Vendor not found:', vendorError);
        setLoading(false);
        return;
      }

      const vendorId = vendorData.id;

      // استدعاء دالة RPC للإحصائيات
      const { data: statsData, error: statsError } = await supabase.rpc('get_vendor_dashboard_stats', { p_vendor_id: vendorId });
      if (statsError) throw statsError;
      const statsRow = (statsData && statsData[0]) || {};

      // المنتجات (حقول المخطط الجديد)
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, price, category_id, stock_quantity')
        .eq('vendor_id', vendorId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (productsError) throw productsError;
      setProducts((productsData || []).map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        category: p.category_id || 'عام',
        stock: p.stock_quantity || 0,
      })));

      setStats({
        totalOrders: Number(statsRow.total_orders || 0),
        totalRevenue: Number(statsRow.total_revenue || 0),
        activeProducts: Number(statsRow.active_products || 0),
        averageRating: Number(statsRow.avg_rating || 0),
        revenueTrend: Number(statsRow.today_revenue || 0),
        ordersTrend: Number(statsRow.today_orders || 0),
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'إجمالي الإيرادات',
      value: formatPrice(stats.totalRevenue),
      icon: DollarSign,
      trend: { 
        value: Math.abs(stats.revenueTrend || 0), 
        isPositive: (stats.revenueTrend || 0) >= 0 
      },
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      title: 'إجمالي الطلبات',
      value: stats.totalOrders.toLocaleString('ar-SA'),
      icon: ShoppingCart,
      trend: { 
        value: Math.abs(stats.ordersTrend || 0), 
        isPositive: (stats.ordersTrend || 0) >= 0 
      },
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'المنتجات النشطة',
      value: stats.activeProducts.toLocaleString('ar-SA'),
      icon: Package,
      trend: { value: 0, isPositive: true },
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      title: 'التقييم',
      value: `${stats.averageRating.toFixed(1)} ⭐`,
      icon: Star,
      trend: { value: 0, isPositive: true },
      gradient: 'from-yellow-500 to-orange-500',
    },
  ];

  const lowStockProducts = products.filter(p => p.stock < 10);

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-[#0A0515]">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-purple-600 dark:text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-900 dark:text-white text-xl">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-[#0A0515]">
      {/* Animated background gradients - Emerald theme for vendor */}
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
          style={{ background: 'radial-gradient(circle, #00A86B 0%, transparent 70%)' }}
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
          style={{ background: 'radial-gradient(circle, #6236FF 0%, transparent 70%)' }}
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
          style={{ background: 'radial-gradient(circle, #FF219D 0%, transparent 70%)' }}
        />
      </div>

      <FuturisticSidebar role="vendor" />
      
      {/* Main Content Area */}
      <div className="md:mr-[280px] transition-all duration-300">
        <FuturisticNavbar userRole="تاجر" />
        
        <main className="pt-16 sm:pt-20 md:pt-24 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 pb-6 sm:pb-8 md:pb-10 relative z-10 max-w-[1800px] mx-auto">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6 md:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
            مرحباً بك في متجرك! 🏪
          </h1>
          <p className="text-gray-600 dark:text-purple-200">إدارة منتجاتك وطلباتك وأرباحك</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          {statsCards.map((stat, index) => (
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

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-4 sm:mb-6 md:mb-8 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 bg-orange-50 dark:bg-[rgba(255,152,0,0.1)] backdrop-blur-xl border border-orange-200 dark:border-[rgba(255,152,0,0.3)]"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-orange-400" />
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-orange-700 dark:text-orange-300">تنبيه: منتجات منخفضة المخزون ({lowStockProducts.length})</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {lowStockProducts.slice(0, 3).map((product) => (
                <div key={product.id} className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-[rgba(15,10,30,0.6)] border border-gray-200 dark:border-transparent">
                  <p className="text-gray-900 dark:text-white text-sm sm:text-base font-semibold mb-1">{product.name}</p>
                  <p className="text-orange-600 dark:text-orange-300 text-xs sm:text-sm">متبقي: <span className="font-bold">{product.stock} قطع</span></p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Products Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">منتجاتي</h2>
            <Link href="/dashboard/vendor/products/new">
              <button className="px-6 py-3 rounded-2xl font-semibold text-white transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(90deg, #00A86B, #00C878)',
                  boxShadow: '0 0 30px rgba(0, 168, 107, 0.5)',
                }}>
                + إضافة منتج جديد
              </button>
            </Link>
          </div>

          {products.length === 0 ? (
            <div 
              className="rounded-3xl p-12 text-center"
              style={{
                background: 'rgba(15, 10, 30, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(98, 54, 255, 0.3)',
              }}
            >
              <Package className="w-20 h-20 text-purple-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-2xl font-bold text-white mb-2">لا توجد منتجات بعد</h3>
              <p className="text-purple-200 mb-6">ابدأ بإضافة منتجك الأول!</p>
              <Link href="/dashboard/vendor/products/new">
                <button className="px-6 py-3 rounded-2xl font-semibold text-white transition-all hover:scale-105"
                  style={{
                    background: 'linear-gradient(90deg, #00A86B, #00C878)',
                    boxShadow: '0 0 30px rgba(0, 168, 107, 0.5)',
                  }}>
                  + إضافة منتج جديد
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product, index) => (
                <FuturisticProductCard
                  key={product.id}
                  {...product}
                  delay={0.8 + index * 0.1}
                />
              ))}
            </div>
          )}
        </motion.div>
        </main>
      </div>
    </div>
  );
}

export default function VendorDashboard() {
  return <VendorDashboardContent />;
}

