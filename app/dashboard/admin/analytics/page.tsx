'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import { supabase } from '@/lib/supabase';

interface Analytics {
  totalRevenue: number;
  totalUsers: number;
  conversionRate: number;
  avgRating: number;
  topProducts: any[];
  recentActivity: any[];
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics>({
    totalRevenue: 0,
    totalUsers: 0,
    conversionRate: 0,
    avgRating: 0,
    topProducts: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // 1. إجمالي الإيرادات من الطلبات المكتملة
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'delivered');
      
      const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      // 2. عدد المستخدمين
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // 3. معدل التحويل (نسبة الطلبات المكتملة إلى إجمالي الطلبات)
      const { count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
      
      const { count: completedOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'delivered');

      const conversionRate = totalOrders && totalOrders > 0 
        ? ((completedOrders || 0) / totalOrders) * 100 
        : 0;

      // 4. متوسط التقييمات
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating');
      
      const avgRating = reviews && reviews.length > 0
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
        : 0;

      // 5. أكثر المنتجات مبيعاً
      const { data: topProducts } = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          price,
          products (
            id,
            name,
            name_ar,
            images
          )
        `)
        .limit(5);

      // تجميع المنتجات حسب product_id
      const productSales = new Map();
      topProducts?.forEach(item => {
        const productId = item.product_id;
        const product = item.products as any;
        if (productSales.has(productId)) {
          const existing = productSales.get(productId);
          existing.quantity += item.quantity;
          existing.revenue += item.price * item.quantity;
        } else {
          productSales.set(productId, {
            id: productId,
            name: product?.name_ar || product?.name || 'منتج',
            quantity: item.quantity,
            revenue: item.price * item.quantity,
            image: product?.images?.[0] || null
          });
        }
      });

      const topProductsArray = Array.from(productSales.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      // 6. النشاط الأخير
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('id, created_at, status, total_amount')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: recentUsers } = await supabase
        .from('users')
        .select('name, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      const { data: recentReviews } = await supabase
        .from('reviews')
        .select('rating, created_at, products(name, name_ar)')
        .order('created_at', { ascending: false })
        .limit(3);

      // دمج النشاطات
      const recentActivity = [
        ...(recentOrders?.map(o => ({
          type: 'order',
          title: `طلب جديد #${o.id.slice(0, 8)}`,
          subtitle: `${o.total_amount?.toFixed(2)} ₪`,
          time: o.created_at,
          icon: '🛒',
          color: 'blue'
        })) || []),
        ...(recentUsers?.map(u => ({
          type: 'user',
          title: `مستخدم جديد: ${u.name}`,
          subtitle: 'انضم للمنصة',
          time: u.created_at,
          icon: '👤',
          color: 'green'
        })) || []),
        ...(recentReviews?.map(r => {
          const product = r.products as any;
          return {
            type: 'review',
            title: `تقييم جديد ${r.rating} نجوم`,
            subtitle: product?.name_ar || product?.name || 'منتج',
            time: r.created_at,
            icon: '⭐',
            color: 'purple'
          };
        }) || [])
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 10);

      setAnalytics({
        totalRevenue,
        totalUsers: usersCount || 0,
        conversionRate,
        avgRating,
        topProducts: topProductsArray,
        recentActivity
      });

    } catch (error) {
      console.error('خطأ في جلب الإحصائيات:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    return `منذ ${diffDays} يوم`;
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gray-50">
        <FuturisticSidebar role="admin" />
        <div className="md:mr-[280px] transition-all duration-300">
          <FuturisticNavbar userName="" userRole="admin" />
          <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">جاري تحميل الإحصائيات...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50">
      <FuturisticSidebar role="admin" />
      
      {/* Main Content Area */}
      <div className="md:mr-[280px] transition-all duration-300">
        <FuturisticNavbar userName="" userRole="admin" />
        
        <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10 relative z-10 max-w-[1800px] mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">الإحصائيات والتحليلات</h1>
            <p className="text-gray-600">تحليل شامل لأداء المنصة</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
              <p className="text-sm opacity-90 mb-1">إجمالي الإيرادات</p>
              <h3 className="text-3xl font-bold">
                {analytics.totalRevenue.toLocaleString('ar-JO', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2 
                })} ₪
              </h3>
              <p className="text-sm mt-2 opacity-90">
                {analytics.totalRevenue > 0 ? '💰 من الطلبات المكتملة' : 'لا توجد إيرادات بعد'}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
              <p className="text-sm opacity-90 mb-1">عدد المستخدمين</p>
              <h3 className="text-3xl font-bold">{analytics.totalUsers.toLocaleString('ar-JO')}</h3>
              <p className="text-sm mt-2 opacity-90">
                {analytics.totalUsers > 0 ? '👥 مستخدم مسجل' : 'لا يوجد مستخدمين'}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
              <p className="text-sm opacity-90 mb-1">معدل التحويل</p>
              <h3 className="text-3xl font-bold">{analytics.conversionRate.toFixed(1)}%</h3>
              <p className="text-sm mt-2 opacity-90">
                {analytics.conversionRate > 0 ? '📈 من إجمالي الطلبات' : 'لا توجد طلبات'}
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-sm p-6 text-white">
              <p className="text-sm opacity-90 mb-1">رضا العملاء</p>
              <h3 className="text-3xl font-bold">
                {analytics.avgRating > 0 ? `${analytics.avgRating.toFixed(1)}/5` : 'لا توجد تقييمات'}
              </h3>
              <p className="text-sm mt-2 opacity-90">
                {analytics.avgRating >= 4 ? '⭐ تقييم ممتاز' : 
                 analytics.avgRating >= 3 ? '⭐ تقييم جيد' : 
                 analytics.avgRating > 0 ? '⭐ يحتاج تحسين' : ''}
              </p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {analytics.topProducts.length > 0 ? (
              <div className="space-y-3">
                {analytics.topProducts.map((product, index) => (
                  <div key={product.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {product.image ? (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                          <Image src={product.image} alt={product.name} fill className="object-cover" sizes="48px" />
                        </div>
                      ) : (
                        <span className="text-2xl">📦</span>
                      )}
                      <div>
                        <p className="font-medium text-gray-800">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.quantity} عملية بيع</p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-800">
                      {product.revenue.toLocaleString('ar-JO', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2 
                      })} ₪
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-4xl mb-2">📦</p>
                <p>لا توجد مبيعات بعد</p>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📊 النشاط الأخير</h2>
            {analytics.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {analytics.recentActivity.map((activity, index) => (
                  <div 
                    key={index} 
                    className={`flex items-start gap-3 p-3 rounded-lg bg-${activity.color}-50`}
                  >
                    <span className="text-2xl">{activity.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{activity.title}</p>
                      <p className="text-sm text-gray-600">{activity.subtitle}</p>
                    </div>
                    <span className="text-xs text-gray-500">{getTimeAgo(activity.time)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-4xl mb-2">📊</p>
                <p>لا يوجد نشاط حديث</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

