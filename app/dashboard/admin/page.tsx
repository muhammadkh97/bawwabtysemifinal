'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import FuturisticSidebarLuxury from '@/components/dashboard/FuturisticSidebarLuxury';
import FuturisticNavbarLuxury from '@/components/dashboard/FuturisticNavbarLuxury';
import ModernDashboardLayoutLuxury, { ModernStatCardLuxury, ModernSectionLuxury } from '@/components/dashboard/ModernDashboardLayoutLuxury';
import { supabase } from '@/lib/supabase';
import {
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Package,
  Store,
  Truck,
  Crown,
  Activity,
  BarChart3
} from 'lucide-react';

// TypeScript Interfaces
interface User {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  user_role: 'admin' | 'vendor' | 'driver' | 'customer' | 'restaurant';
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number | null;
}

interface OrderItem {
  product_id: string;
  quantity: number;
  item_total: string;
  products: Product | Product[] | null;
}

interface ProductSalesData extends Product {
  totalQuantity: number;
  totalRevenue: number;
}

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

  const [quickStats, setQuickStats] = useState([
    { label: 'تجار نشطين', value: '0', icon: Store, color: 'from-emerald-500 to-teal-500' },
    { label: 'مطاعم', value: '0', icon: Store, color: 'from-pink-500 to-red-500' },
    { label: 'سائقين', value: '0', icon: Truck, color: 'from-blue-500 to-cyan-500' },
    { label: 'عملاء', value: '0', icon: Users, color: 'from-yellow-500 to-orange-500' },
  ]);

  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [topProducts, setTopProducts] = useState<ProductSalesData[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: adminStats, error: statsError } = await supabase.rpc('get_admin_dashboard_stats');
      if (statsError) throw statsError;

      const statsRow = (adminStats && adminStats[0]) || {};

      setStats([
        {
          title: 'إجمالي المستخدمين',
          value: Number(statsRow.total_users || 0).toLocaleString('ar-SA'),
          icon: Users,
          trend: { value: 15, isPositive: true },
          gradient: 'from-blue-500 to-cyan-500',
        },
        {
          title: 'إجمالي الطلبات',
          value: Number(statsRow.total_orders || 0).toLocaleString('ar-SA'),
          icon: ShoppingCart,
          trend: { value: 23, isPositive: true },
          gradient: 'from-purple-500 to-pink-500',
        },
        {
          title: 'إجمالي المبيعات',
          value: `${Number(statsRow.total_revenue || 0).toLocaleString('ar-SA')} ر.س`,
          icon: DollarSign,
          trend: { value: 12, isPositive: true },
          gradient: 'from-emerald-500 to-teal-500',
        },
        {
          title: 'متوسط قيمة الطلب',
          value: `${Number(statsRow.avg_order_value || 0).toFixed(1)} ر.س`,
          icon: TrendingUp,
          trend: { value: 8, isPositive: true },
          gradient: 'from-orange-500 to-red-500',
        },
      ]);

      setQuickStats([
        { label: 'تجار نشطين', value: Number(statsRow.total_vendors || 0).toString(), icon: Store, color: 'from-emerald-500 to-teal-500' },
        { label: 'مطاعم', value: Number(statsRow.total_restaurants || 0).toString(), icon: Store, color: 'from-pink-500 to-red-500' },
        { label: 'سائقين', value: Number(statsRow.total_drivers || 0).toString(), icon: Truck, color: 'from-blue-500 to-cyan-500' },
        { label: 'عملاء', value: Number(statsRow.total_customers || 0).toString(), icon: Users, color: 'from-yellow-500 to-orange-500' },
      ]);

      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name, email, phone, user_role, created_at')
        .order('created_at', { ascending: false })
        .limit(6);

      setRecentUsers(usersData || []);

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
            stock
          )
        `);

      if (orderItemsData) {
        const productSales = new Map<string, ProductSalesData>();
        (orderItemsData as unknown as OrderItem[]).forEach((item) => {
          const product = Array.isArray(item.products) ? item.products[0] : item.products;
          if (product) {
            const existing = productSales.get(item.product_id) || {
              ...item.products,
              totalQuantity: 0,
              totalRevenue: 0
            };
            existing.totalQuantity += item.quantity;
            existing.totalRevenue += Number(item.item_total);
            productSales.set(item.product_id, existing);
          }
        });

        const sorted = Array.from(productSales.values())
          .sort((a, b) => b.totalRevenue - a.totalRevenue)
          .slice(0, 6);

        setTopProducts(sorted);
      }

      setLoading(false);
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error instanceof Error ? error.message : 'Unknown error');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0B0F1A]">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-slate-300 dark:border-white/20 border-t-indigo-600 dark:border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-900 dark:text-white text-xl font-bold">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="md:mr-[280px] transition-all duration-300">
      <FuturisticNavbarLuxury userName="المدير" userRole="admin" />
      
      <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10">
        <ModernDashboardLayoutLuxury 
          title="لوحة تحكم المدير 👑" 
          subtitle="نظرة شاملة على أداء المنصة"
          icon={Crown}
          role="admin"
        >
          {/* Main Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <ModernStatCardLuxury
                key={stat.title}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                gradient={stat.gradient}
                trend={stat.trend}
                delay={index * 0.1}
                role="admin"
              />
            ))}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {quickStats.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ y: -5, scale: 1.05 }}
                className="relative group"
              >
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${item.color} rounded-2xl blur opacity-20 dark:opacity-30 group-hover:opacity-40 dark:group-hover:opacity-50 transition duration-500`}></div>
                <div className="relative bg-white/80 dark:bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-slate-100 dark:border-white/20 text-center">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-slate-600 dark:text-white/70 text-sm mb-1">{item.label}</p>
                  <p className="text-slate-900 dark:text-white text-2xl font-black">{item.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Recent Users Section */}
          <ModernSectionLuxury title="أحدث المستخدمين" icon={Users} delay={0.8} role="admin">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-slate-100 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                      {user.full_name?.charAt(0) || 'م'}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-slate-900 dark:text-white font-bold">{user.full_name || 'مستخدم'}</h4>
                      <p className="text-slate-600 dark:text-white/50 text-xs">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-1 rounded-lg ${
                      user.user_role === 'admin' ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
                      user.user_role === 'vendor' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                      user.user_role === 'driver' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                      'bg-purple-500/20 text-purple-600 dark:text-purple-400'
                    }`}>
                      {user.user_role === 'admin' ? '👑 مدير' :
                       user.user_role === 'vendor' ? '🏪 بائع' :
                       user.user_role === 'driver' ? '🚗 سائق' :
                       '👤 عميل'}
                    </span>
                    <span className="text-slate-500 dark:text-white/40">
                      {new Date(user.created_at).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </ModernSectionLuxury>

          {/* Top Products Section */}
          <ModernSectionLuxury title="أفضل المنتجات مبيعاً" icon={BarChart3} delay={1.2} role="admin">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 + index * 0.1 }}
                  className="bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-slate-100 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-slate-900 dark:text-white font-bold mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                        {product.name}
                      </h4>
                      <p className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                        {product.price} ر.س
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-200 dark:border-white/5">
                    <span className="text-slate-600 dark:text-white/50">
                      📦 مبيعات: <span className="text-slate-900 dark:text-white font-bold">{product.totalQuantity}</span>
                    </span>
                    <span className="text-slate-600 dark:text-white/50">
                      💰 <span className="text-emerald-600 dark:text-emerald-400 font-bold">{product.totalRevenue.toFixed(2)} ر.س</span>
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </ModernSectionLuxury>

          {/* Activity Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
            className="mt-8 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
              <Activity className="w-4 h-4 text-green-400 animate-pulse" />
              <span className="text-white/70 text-sm">النظام يعمل بشكل طبيعي</span>
            </div>
          </motion.div>
        </ModernDashboardLayoutLuxury>
      </main>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-slate-950">
      <FuturisticSidebarLuxury role="admin" />
      <AdminDashboardContent />
    </div>
  );
}
