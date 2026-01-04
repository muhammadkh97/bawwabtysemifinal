'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import FuturisticStatCard from '@/components/dashboard/FuturisticStatCard';
import FuturisticProductCard from '@/components/dashboard/FuturisticProductCard';
import {
  Package,
  ShoppingCart,
  DollarSign,
  Star,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  category?: string;
  stock: number;
  sales?: number;
  featured_image?: string;
  images?: string[];
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

  const { userId } = useAuth();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    if (userId) {
      fetchDashboardData();
    }
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Get store ID (vendor_id)
      const { data: storeData } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!storeData) {
        setLoading(false);
        return;
      }

      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, price, stock, featured_image, images')
        .eq('vendor_id', storeData.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (productsData) {
        setProducts(productsData);
      }

      // Fetch orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('vendor_id', storeData.id);

      // Calculate stats
      const totalOrders = ordersData?.length || 0;
      const totalRevenue = ordersData?.reduce((sum, order) => sum + parseFloat(order.total || 0), 0) || 0;
      const activeProducts = productsData?.length || 0;

      // Fetch reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('rating')
        .eq('vendor_id', storeData.id);

      const averageRating = reviewsData && reviewsData.length > 0
        ? reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length
        : 0;

      setStats({
        totalOrders,
        totalRevenue,
        activeProducts,
        averageRating,
        revenueTrend: 12.5,
        ordersTrend: 8.3,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock < 10);

  const statsCards = [
    {
      title: 'إجمالي الإيرادات',
      value: formatPrice(stats.totalRevenue),
      icon: DollarSign,
      gradient: 'from-emerald-500 to-teal-500',
      trend: stats.revenueTrend ? { value: stats.revenueTrend, isPositive: stats.revenueTrend > 0 } : undefined,
    },
    {
      title: 'إجمالي الطلبات',
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      gradient: 'from-blue-500 to-cyan-500',
      trend: stats.ordersTrend ? { value: stats.ordersTrend, isPositive: stats.ordersTrend > 0 } : undefined,
    },
    {
      title: 'المنتجات النشطة',
      value: stats.activeProducts.toString(),
      icon: Package,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      title: 'التقييم',
      value: stats.averageRating.toFixed(1),
      icon: Star,
      gradient: 'from-yellow-500 to-orange-500',
    },
  ];

  const quickStats = [
    { 
      label: 'طلبات معلقة', 
      value: products.filter(p => p.stock < 10).length.toString(), 
      icon: AlertTriangle, 
      color: 'from-orange-500 to-red-500' 
    },
    { 
      label: 'منتجات منخفضة', 
      value: products.filter(p => p.stock < 10).length.toString(), 
      icon: Package, 
      color: 'from-red-500 to-pink-500' 
    },
    { 
      label: 'متوسط المبيعات', 
      value: stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders).toString() : '0', 
      icon: TrendingUp, 
      color: 'from-blue-500 to-cyan-500' 
    },
    { 
      label: 'عدد التقييمات', 
      value: '0', 
      icon: Star, 
      color: 'from-yellow-500 to-orange-500' 
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0515]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-purple-300 text-lg">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0A0515]">
      {/* Animated Background Gradients */}
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
            opacity: [0.2, 0.3, 0.2],
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
            opacity: [0.2, 0.4, 0.2],
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

      <main className="relative z-10 max-w-[1800px] mx-auto px-4 md:px-8 lg:px-10 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            مرحباً بك في متجرك! 🏪
          </h1>
          <p className="text-purple-200">إدارة منتجاتك وطلباتك وأرباحك</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {quickStats.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="backdrop-blur-xl bg-white/5 border border-purple-500/20 rounded-xl p-4 text-center hover:bg-white/10 transition-all duration-300"
            >
              <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-white mb-1">{item.value}</p>
              <p className="text-sm text-purple-200">{item.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="backdrop-blur-xl bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6 mb-8"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-orange-300 mb-2">
                  تنبيه: منتجات منخفضة المخزون
                </h3>
                <p className="text-orange-200/80 mb-3">
                  لديك {lowStockProducts.length} منتج بحاجة لإعادة التخزين
                </p>
                <div className="flex flex-wrap gap-2">
                  {lowStockProducts.slice(0, 3).map(product => (
                    <span key={product.id} className="px-3 py-1 bg-orange-500/20 rounded-full text-sm text-orange-300">
                      {product.name} ({product.stock} متبقي)
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Recent Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="backdrop-blur-xl bg-white/5 border border-purple-500/20 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">أحدث المنتجات</h2>
            <Link 
              href="/dashboard/vendor/products"
              className="text-purple-400 hover:text-purple-300 font-semibold text-sm transition-colors"
            >
              عرض الكل ←
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-purple-400/50 mx-auto mb-4" />
              <p className="text-purple-300 mb-4">لا توجد منتجات بعد</p>
              <Link
                href="/dashboard/vendor/products/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300"
              >
                <Package className="w-5 h-5" />
                إضافة منتج جديد
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.slice(0, 8).map((product, index) => (
                <FuturisticProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  image={product.featured_image || (product.images && product.images[0])}
                  category={'عام'}
                  stock={product.stock}
                  sales={0}
                  delay={0.9 + index * 0.1}
                />
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

export default function VendorDashboardPage() {
  return <VendorDashboardContent />;
}
