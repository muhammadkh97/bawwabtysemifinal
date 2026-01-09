'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import ModernDashboardLayoutLuxury, { ModernStatCardLuxury, ModernSectionLuxury } from '@/components/dashboard/ModernDashboardLayoutLuxury';
import FuturisticSidebarLuxury from '@/components/dashboard/FuturisticSidebarLuxury';
import FuturisticNavbarLuxury from '@/components/dashboard/FuturisticNavbarLuxury';
import {
  Package,
  ShoppingCart,
  DollarSign,
  Star,
  AlertTriangle,
  TrendingUp,
  Plus,
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

interface Order {
  id: string;
  vendor_id: string;
  total: string | number;
  status: string;
  created_at: string;
}

interface Review {
  id: string;
  vendor_id: string;
  rating: number;
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
  const [formattedRevenue, setFormattedRevenue] = useState<string>('');

  const { userId } = useAuth();
  const { formatPrice, selectedCurrency } = useCurrency();

  useEffect(() => {
    if (userId) {
      fetchDashboardData();
    }
  }, [userId]);

  // Format revenue when stats change
  useEffect(() => {
    async function formatRevenue() {
      const formatted = await formatPrice(stats.totalRevenue, 'SAR');
      setFormattedRevenue(formatted);
    }
    formatRevenue();
  }, [stats.totalRevenue, selectedCurrency, formatPrice]);

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
      const totalRevenue = (ordersData as Order[] | null)?.reduce((sum: number, order) => sum + parseFloat(String(order.total || 0)), 0) || 0;
      const activeProducts = productsData?.length || 0;

      // Fetch reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('rating')
        .eq('vendor_id', storeData.id);

      const averageRating = reviewsData && reviewsData.length > 0
        ? (reviewsData as Review[]).reduce((sum: number, review) => sum + review.rating, 0) / reviewsData.length
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
      value: formattedRevenue,
      icon: DollarSign,
      gradient: 'from-emerald-500 to-teal-500',
      trend: stats.revenueTrend ? { value: stats.revenueTrend, isPositive: stats.revenueTrend > 0 } : undefined,
    },
    {
      title: 'إجمالي الطلبات',
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      gradient: 'from-indigo-500 to-purple-500',
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
      value: '0', 
      icon: AlertTriangle, 
      color: 'from-orange-500 to-red-500' 
    },
    { 
      label: 'منتجات منخفضة', 
      value: lowStockProducts.length.toString(), 
      icon: Package, 
      color: 'from-red-500 to-pink-500' 
    },
    { 
      label: 'متوسط المبيعات', 
      value: stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders).toString() : '0', 
      icon: TrendingUp, 
      color: 'from-indigo-500 to-purple-500' 
    },
    { 
      label: 'عدد التقييمات', 
      value: '0', 
      icon: Star, 
      color: 'from-yellow-500 to-orange-500' 
    },
  ];

  return (
    <ModernDashboardLayoutLuxury
      title="مرحباً بك في متجرك! 🏪"
      subtitle="إدارة منتجاتك وطلباتك وأرباحك"
      loading={loading}
      role="vendor"
    >
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => (
          <ModernStatCardLuxury
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
            gradient={stat.gradient}
            delay={index * 0.1}
            role="vendor"
          />
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {quickStats.map((item, index) => (
          <ModernStatCardLuxury
            key={item.label}
            title={item.label}
            value={item.value}
            icon={item.icon}
            gradient={item.color}
            delay={0.4 + index * 0.1}
            compact
            role="vendor"
          />
        ))}
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <ModernSectionLuxury
          title="تنبيه: منتجات منخفضة المخزون"
          subtitle={`لديك ${lowStockProducts.length} منتج بحاجة لإعادة التخزين`}
          icon={AlertTriangle}
          delay={0.5}
          role="vendor"
        >
          <div className="flex flex-wrap gap-2">
            {lowStockProducts.slice(0, 5).map(product => (
              <span key={product.id} className="px-3 py-1 bg-orange-500/20 rounded-full text-sm text-orange-300 border border-orange-500/30">
                {product.name} ({product.stock} متبقي)
              </span>
            ))}
          </div>
        </ModernSectionLuxury>
      )}

      {/* Recent Products */}
      <ModernSectionLuxury
        title="أحدث المنتجات"
        action={
          <Link 
            href="/dashboard/vendor/products"
            className="text-purple-400 hover:text-purple-300 font-semibold text-sm transition-colors"
          >
            عرض الكل ←
          </Link>
        }
        delay={0.6}
        role="vendor"
      >
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-purple-400/50 mx-auto mb-4" />
            <p className="text-purple-300 mb-4">لا توجد منتجات بعد</p>
            <Link
              href="/dashboard/vendor/products/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
            >
              <Plus className="w-5 h-5" />
              إضافة منتج جديد
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.slice(0, 8).map((product, index) => (
              <Link
                key={product.id}
                href={`/dashboard/vendor/products/${product.id}`}
                className="group relative backdrop-blur-xl bg-white/5 border border-purple-500/20 rounded-xl p-4 hover:bg-white/10 hover:border-purple-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-1"
              >
                {product.featured_image || (product.images && product.images[0]) ? (
                  <img
                    src={product.featured_image || product.images![0]}
                    alt={product.name}
                    className="w-full h-40 object-cover rounded-lg mb-3"
                  />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg mb-3 flex items-center justify-center">
                    <Package className="w-12 h-12 text-purple-300" />
                  </div>
                )}
                <h3 className="text-white font-semibold mb-2 line-clamp-1">{product.name}</h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-300">{product.price} ر.س</span>
                  <span className={`${product.stock < 10 ? 'text-orange-400' : 'text-green-400'}`}>
                    المخزون: {product.stock}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </ModernSectionLuxury>
    </ModernDashboardLayoutLuxury>
  );
}

export default function VendorDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <FuturisticSidebarLuxury role="vendor" />
      <div className="md:mr-[280px] transition-all duration-300">
        <FuturisticNavbarLuxury userRole="vendor" />
        <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10">
          <VendorDashboardContent />
        </main>
      </div>
    </div>
  );
}
