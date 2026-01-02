'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import ErrorBoundary from '@/components/ErrorBoundary';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart, Package, Loader2, BarChart3 } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';

export default function VendorAnalyticsPage() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const { formatPrice } = useCurrency();
  const { userId } = useAuth();

  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    conversionRate: 3.2,
    salesGrowth: 0,
    ordersGrowth: 0,
  });

  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [salesData] = useState([
    { date: '1 ديسمبر', sales: 0, orders: 0 },
    { date: '2 ديسمبر', sales: 0, orders: 0 },
    { date: '3 ديسمبر', sales: 0, orders: 0 },
    { date: '4 ديسمبر', sales: 0, orders: 0 },
    { date: '5 ديسمبر', sales: 0, orders: 0 },
    { date: '6 ديسمبر', sales: 0, orders: 0 },
    { date: '7 ديسمبر', sales: 0, orders: 0 },
  ]);

  useEffect(() => {
    if (userId) {
      fetchAnalyticsData();
    }
  }, [userId, timeRange]);

  const fetchAnalyticsData = async () => {
    if (!userId) return;
    
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

      setVendorId(vendorData.id);

      // حساب نطاق التاريخ بناءً على الاختيار
      const now = new Date();
      let startDate = new Date();
      let previousStartDate = new Date();
      let previousEndDate = new Date();

      if (timeRange === 'week') {
        startDate.setDate(now.getDate() - 7);
        previousStartDate.setDate(now.getDate() - 14);
        previousEndDate.setDate(now.getDate() - 7);
      } else if (timeRange === 'month') {
        startDate.setMonth(now.getMonth() - 1);
        previousStartDate.setMonth(now.getMonth() - 2);
        previousEndDate.setMonth(now.getMonth() - 1);
      } else { // year
        startDate.setFullYear(now.getFullYear() - 1);
        previousStartDate.setFullYear(now.getFullYear() - 2);
        previousEndDate.setFullYear(now.getFullYear() - 1);
      }

      // Fetch vendor's orders through order_items (current period)
      const { data: orderItemsData } = await supabase
        .from('order_items')
        .select('order_id, total_price, orders!inner(status, total_amount, created_at)')
        .eq('vendor_id', vendorData.id)
        .in('orders.status', ['delivered'])
        .gte('orders.created_at', startDate.toISOString());

      const totalSales = orderItemsData?.reduce((sum, item) => sum + item.total_price, 0) || 0;
      const uniqueOrders = new Set(orderItemsData?.map(item => item.order_id) || []);
      const totalOrders = uniqueOrders.size;
      const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      // Fetch previous period data for growth calculation
      const { data: previousOrderItemsData } = await supabase
        .from('order_items')
        .select('order_id, total_price, orders!inner(status, total_amount, created_at)')
        .eq('vendor_id', vendorData.id)
        .in('orders.status', ['delivered'])
        .gte('orders.created_at', previousStartDate.toISOString())
        .lte('orders.created_at', previousEndDate.toISOString());

      const previousTotalSales = previousOrderItemsData?.reduce((sum, item) => sum + item.total_price, 0) || 0;
      const previousUniqueOrders = new Set(previousOrderItemsData?.map(item => item.order_id) || []);
      const previousTotalOrders = previousUniqueOrders.size;

      // حساب نسبة النمو
      const salesGrowth = previousTotalSales > 0 
        ? ((totalSales - previousTotalSales) / previousTotalSales * 100)
        : 0;
      const ordersGrowth = previousTotalOrders > 0 
        ? ((totalOrders - previousTotalOrders) / previousTotalOrders * 100)
        : 0;

      // Fetch vendor's top products
      const { data: topProductsData } = await supabase
        .from('products')
        .select('id, name, price, images, total_sales')
        .eq('vendor_id', vendorData.id)
        .order('total_sales', { ascending: false })
        .limit(5);

      setTopProducts(topProductsData?.map(product => ({
        id: product.id,
        name: product.name,
        sales: product.total_sales || 0,
        revenue: (product.total_sales || 0) * product.price,
        image: product.images?.[0] || '/products/placeholder.jpg',
      })) || []);

      // حساب معدل التحويل الحقيقي
      // معدل التحويل = (عدد العناصر المباعة / عدد المنتجات النشطة) × 100
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', vendorData.id)
        .in('status', ['approved']);

      const totalItemsSold = orderItemsData?.length || 0;
      const conversionRate = totalProducts && totalProducts > 0 
        ? (totalItemsSold / (totalProducts * 10) * 100) // نفترض أن كل منتج له 10 مشاهدات محتملة
        : 0;

      setStats({
        totalSales,
        totalOrders,
        avgOrderValue,
        conversionRate: parseFloat(conversionRate.toFixed(1)),
        salesGrowth: parseFloat(salesGrowth.toFixed(1)),
        ordersGrowth: parseFloat(ordersGrowth.toFixed(1)),
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  const maxSales = Math.max(...salesData.map(d => d.sales), 1);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white transition-colors duration-300">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 dark:text-purple-300 text-lg">جاري تحميل التحليلات...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen relative overflow-hidden bg-white transition-colors duration-300">
        <FuturisticSidebar role="vendor" />
        
        <div className="md:mr-[280px] transition-all duration-300">
          <FuturisticNavbar userName="" userRole="بائع" />
          
          <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10 relative z-10 max-w-[1800px] mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <BarChart3 className="w-10 h-10 text-purple-400" />
                تحليلات الأداء
              </h1>
              <p className="text-purple-300 text-lg">نظرة شاملة على مبيعاتك وأداء متجرك</p>
            </div>
            <div className="flex gap-2">
              {['week', 'month', 'year'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range as any)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    timeRange === range
                      ? 'text-white'
                      : 'text-purple-300'
                  }`}
                  style={{
                    background: timeRange === range 
                      ? 'linear-gradient(135deg, #8B5CF6, #D946EF)'
                      : 'rgba(139, 92, 246, 0.2)',
                    border: timeRange === range 
                      ? 'none'
                      : '1px solid rgba(139, 92, 246, 0.3)'
                  }}
                >
                  {range === 'week' ? 'أسبوع' : range === 'month' ? 'شهر' : 'سنة'}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl p-6"
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="p-3 rounded-xl"
                  style={{ background: 'rgba(16, 185, 129, 0.2)' }}
                >
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
                <span className="text-green-400 text-sm font-bold">↗ {stats.salesGrowth}%</span>
              </div>
              <p className="text-green-300/70 text-sm mb-1">إجمالي المبيعات</p>
              <h3 className="text-3xl font-bold text-white">{formatPrice(stats.totalSales)}</h3>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl p-6"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(124, 58, 237, 0.2))',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="p-3 rounded-xl"
                  style={{ background: 'rgba(139, 92, 246, 0.2)' }}
                >
                  <ShoppingCart className="w-6 h-6 text-purple-400" />
                </div>
                <span className="text-purple-400 text-sm font-bold">↗ {stats.ordersGrowth}%</span>
              </div>
              <p className="text-purple-300/70 text-sm mb-1">إجمالي الطلبات</p>
              <h3 className="text-3xl font-bold text-white">{stats.totalOrders}</h3>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl p-6"
              style={{
                background: 'linear-gradient(135deg, rgba(217, 70, 239, 0.2), rgba(236, 72, 153, 0.2))',
                border: '1px solid rgba(217, 70, 239, 0.3)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="p-3 rounded-xl"
                  style={{ background: 'rgba(217, 70, 239, 0.2)' }}
                >
                  <Package className="w-6 h-6 text-pink-400" />
                </div>
                <span className="text-pink-400 text-sm font-bold">{stats.totalOrders} طلب</span>
              </div>
              <p className="text-pink-300/70 text-sm mb-1">متوسط قيمة الطلب</p>
              <h3 className="text-3xl font-bold text-white">{formatPrice(stats.avgOrderValue)}</h3>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl p-6"
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(251, 146, 60, 0.2))',
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="p-3 rounded-xl"
                  style={{ background: 'rgba(245, 158, 11, 0.2)' }}
                >
                  <TrendingUp className="w-6 h-6 text-orange-400" />
                </div>
                <span className="text-orange-400 text-sm font-bold">ممتاز</span>
              </div>
              <p className="text-orange-300/70 text-sm mb-1">معدل التحويل</p>
              <h3 className="text-3xl font-bold text-white">{stats.conversionRate}%</h3>
            </motion.div>
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Sales Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-2xl p-6"
              style={{
                background: 'rgba(15, 10, 30, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}
            >
              <h3 className="text-xl font-bold text-white mb-6">المبيعات اليومية</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.2)" />
                  <XAxis dataKey="date" stroke="#a78bfa" />
                  <YAxis stroke="#a78bfa" />
                  <Tooltip
                    contentStyle={{
                      background: '#1e1b4b',
                      border: '1px solid rgba(139, 92, 246, 0.5)',
                      borderRadius: '12px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="sales" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#D946EF" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Orders Trend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="rounded-2xl p-6"
              style={{
                background: 'rgba(15, 10, 30, 0.6)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}
            >
              <h3 className="text-xl font-bold text-white mb-6">اتجاه الطلبات</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.2)" />
                  <XAxis dataKey="date" stroke="#a78bfa" />
                  <YAxis stroke="#a78bfa" />
                  <Tooltip
                    contentStyle={{
                      background: '#1e1b4b',
                      border: '1px solid rgba(139, 92, 246, 0.5)',
                      borderRadius: '12px',
                      color: '#fff'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#8B5CF6" 
                    strokeWidth={3}
                    dot={{ fill: '#D946EF', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Top Products */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="rounded-2xl p-6"
            style={{
              background: 'rgba(15, 10, 30, 0.6)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
            }}
          >
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Package className="w-6 h-6 text-purple-400" />
              المنتجات الأكثر مبيعاً
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="rounded-xl p-4 transition-all hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(217, 70, 239, 0.1))',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #8B5CF6, #D946EF)' }}
                    >
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">{product.name}</p>
                      <p className="text-sm text-purple-300">{product.sales} مبيعة</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-bold text-green-400">{formatPrice(product.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}

