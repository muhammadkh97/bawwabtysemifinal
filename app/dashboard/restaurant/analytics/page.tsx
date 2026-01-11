'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { useRouter } from 'next/navigation';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, Users, Calendar, Package, Star, ArrowUp, ArrowDown } from 'lucide-react';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  averageRating: number;
  revenueChange: number;
  ordersChange: number;
  topProducts: Array<{ name: string; sales: number; revenue: number }>;
  dailyRevenue: Array<{ date: string; amount: number }>;
}

export default function RestaurantAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    averageRating: 0,
    revenueChange: 0,
    ordersChange: 0,
    topProducts: [],
    dailyRevenue: []
  });
  const [vendorId, setVendorId] = useState<string>('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Get vendor ID
      const { data: vendorData } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (vendorData) {
        setVendorId(vendorData.id);
        await fetchAnalytics(vendorData.id);
      }

      setLoading(false);
    } catch (error) {
      logger.error('Error:', error);
      router.push('/auth/login');
    }
  };

  const fetchAnalytics = async (vId: string) => {
    try {
      // Fetch orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('vendor_id', vId);

      // Fetch products
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', vId);

      // Fetch reviews
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('vendor_id', vId);

      // Calculate analytics
      const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const totalOrders = orders?.length || 0;
      const totalProducts = products?.length || 0;
      const averageRating = reviews?.length 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0;

      // Calculate revenue change (mock data for demo)
      const revenueChange = 12.5;
      const ordersChange = 8.3;

      // Top products
      const productSales: { [key: string]: { name: string; sales: number; revenue: number } } = {};
      orders?.forEach(order => {
        order.order_items?.forEach((item: any) => {
          if (!productSales[item.product_id]) {
            productSales[item.product_id] = {
              name: item.product_name || 'منتج',
              sales: 0,
              revenue: 0
            };
          }
          productSales[item.product_id].sales += item.quantity;
          productSales[item.product_id].revenue += item.price * item.quantity;
        });
      });

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setAnalytics({
        totalRevenue,
        totalOrders,
        totalProducts,
        averageRating,
        revenueChange,
        ordersChange,
        topProducts,
        dailyRevenue: []
      });
    } catch (error) {
      logger.error('Error fetching analytics:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <FuturisticNavbar />
      <div className="flex">
        <FuturisticSidebar role="restaurant" />
        <div className="md:mr-[280px] transition-all duration-300 w-full">
          <main className="pt-16 sm:pt-20 md:pt-24 px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8 md:pb-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-black text-gray-900 mb-2">📊 الإحصائيات والتحليلات</h1>
            <p className="text-gray-600">تحليل أداء المطعم والمبيعات</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Revenue */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-10 h-10" />
                <span className={`flex items-center gap-1 text-sm ${analytics.revenueChange >= 0 ? 'text-green-100' : 'text-red-100'}`}>
                  {analytics.revenueChange >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  {Math.abs(analytics.revenueChange)}%
                </span>
              </div>
              <h3 className="text-3xl font-bold mb-1">{analytics.totalRevenue.toFixed(2)} ₪</h3>
              <p className="text-green-100">إجمالي الإيرادات</p>
            </motion.div>

            {/* Total Orders */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <ShoppingBag className="w-10 h-10" />
                <span className={`flex items-center gap-1 text-sm ${analytics.ordersChange >= 0 ? 'text-blue-100' : 'text-red-100'}`}>
                  {analytics.ordersChange >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  {Math.abs(analytics.ordersChange)}%
                </span>
              </div>
              <h3 className="text-3xl font-bold mb-1">{analytics.totalOrders}</h3>
              <p className="text-blue-100">إجمالي الطلبات</p>
            </motion.div>

            {/* Total Products */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <Package className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-bold mb-1">{analytics.totalProducts}</h3>
              <p className="text-orange-100">عدد المنتجات</p>
            </motion.div>

            {/* Average Rating */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-3xl p-6 text-white shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <Star className="w-10 h-10 fill-current" />
              </div>
              <h3 className="text-3xl font-bold mb-1">{analytics.averageRating.toFixed(1)} ⭐</h3>
              <p className="text-yellow-100">متوسط التقييم</p>
            </motion.div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-3xl p-6 shadow-lg mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-orange-600" />
              المنتجات الأكثر مبيعاً
            </h2>
            
            {analytics.topProducts.length > 0 ? (
              <div className="space-y-4">
                {analytics.topProducts.map((product, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        #{index + 1}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-600">{product.sales} مبيعات</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-2xl font-bold text-orange-600">{product.revenue.toFixed(2)} ₪</p>
                      <p className="text-sm text-gray-600">إجمالي الإيرادات</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">لا توجد مبيعات بعد</p>
              </div>
            )}
          </div>

          {/* Performance Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📈 نظرة عامة على الأداء</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-700">متوسط قيمة الطلب</span>
                  <span className="font-bold text-gray-900">
                    {analytics.totalOrders > 0 ? (analytics.totalRevenue / analytics.totalOrders).toFixed(2) : 0} ₪
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-700">معدل إكمال الطلبات</span>
                  <span className="font-bold text-green-600">95%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-700">متوسط وقت التحضير</span>
                  <span className="font-bold text-blue-600">25 دقيقة</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🎯 الأهداف الشهرية</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">هدف الإيرادات</span>
                    <span className="font-bold text-gray-900">{((analytics.totalRevenue / 10000) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full"
                      style={{ width: `${Math.min((analytics.totalRevenue / 10000) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">هدف الطلبات</span>
                    <span className="font-bold text-gray-900">{((analytics.totalOrders / 100) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full"
                      style={{ width: `${Math.min((analytics.totalOrders / 100) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </main>
        </div>
      </div>
    </>
  );
}
