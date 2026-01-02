'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
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
  ArrowUp,
  ArrowDown,
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

      // Get vendor ID
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!vendorData) {
        setLoading(false);
        return;
      }

      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', vendorData.id)
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
        .eq('vendor_id', vendorData.id);

      // Calculate stats
      const totalOrders = ordersData?.length || 0;
      const totalRevenue = ordersData?.reduce((sum, order) => sum + parseFloat(order.total || 0), 0) || 0;
      const activeProducts = productsData?.length || 0;

      // Fetch reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('rating')
        .eq('vendor_id', vendorData.id);

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
      <div className="min-h-screen flex items-center justify-center bg-[#0A0515]">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-purple-300 text-lg">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0A0515]">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
          style={{ backgro"relative group"
              >
                <div
                  className="relative backdrop-blur-xl bg-white/5 border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/40 transition-all duration-300 overflow-hidden"
                  style={{
                    boxShadow: '0 8px 32px rgba(98, 54, 255, 0.1)',
                  }}
                >
                  {/* Gradient Overlay on Hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                  />

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg`}
                        style={{
                          boxShadow: '0 4px 20px rgba(98, 54, 255, 0.3)',
                        }}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      {card.trend.value > 0 && (
                        <div
                          className={`flex items-center gap-1 text-sm font-semibold ${
                            card.trend.isPositive ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {card.trend.isPositive ? (
                        ackdrop-blur-xl bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6 mb-8"
          >
            <div className="flex items-start gap-4">
              <div className="bg-gradient-to-br from-orange-500 to-red-500 p-3 rounded-xl shadow-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2">تنبيه: منتجات قريبة من النفاذ</h3>
                <p className="text-purple-200 mb-4">لديك {lowStockProducts.length} منتج بكمية قليلة في المخزون</p>
                <Link 
                  href="/dashboard/vendor/products"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg transition-all duration-300"
                >
                  <Package className="w-4 h-4" />
                  عرض المنتجات
                </Link>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.slice(0, 6).map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="backdrop-blur-xl bg-white/5 border border-purple-500/20 rounded-xl p-4 hover:border-purple-500/40 hover:bg-white/10 transition-all duration-300"
                >
                  <h3 className="font-semibold text-white mb-2 truncate">{product.name}</h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-purple-300">السعر:</span>
                    <span className="font-bold text-white">{formatPrice(product.price)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-purple-300">المخزون:</span>
                    <span className={`font-semibold ${product.stock < 10 ? 'text-red-400' : 'text-emerald-4
          })}
        </motion.div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-8"
          >
            <div className="flex items-start gap-4">
              <div className="bg-orange-100 p-3 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">تنبيه: منتجات قريبة من النفاذ</h3>
                <p className="text-gray-700 mb-4">لديك {lowStockProducts.length} منتج بكمية قليلة في المخزون</p>
                <Link 
                  href="/dashboard/vendor/products"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Package className="w-4 h-4" />
                  عرض المنتجات
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Recent Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-[#0A0515] border border-gray-100 rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">أحدث المنتجات</h2>
            <Link 
              href="/dashboard/vendor/products"
              className="text-pink-500 hover:text-pink-600 font-semibold text-sm transition-colors"
            >
              عرض الكل ←
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">لا توجد منتجات بعد</p>
              <Link
                href="/dashboard/vendor/products/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all duration-300"
              >
                <Package className="w-5 h-5" />
                إضافة منتج جديد
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.slice(0, 6).map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="bg-[#0A0515] border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all duration-300"
                >
                  <h3 className="font-semibold text-gray-900 mb-2 truncate">{product.name}</h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">السعر:</span>
                    <span className="font-bold text-gray-900">{formatPrice(product.price)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-600">المخزون:</span>
                    <span className={`font-semibold ${product.stock < 10 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {product.stock}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

export default function VendorDashboard() {
  return <VendorDashboardContent />;
}
