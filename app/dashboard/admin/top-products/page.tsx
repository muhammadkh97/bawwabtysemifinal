'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, TrendingUp, Filter, Search, ArrowLeft, Loader2 } from 'lucide-react';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';
import FuturisticProductCard from '@/components/dashboard/FuturisticProductCard';
import { supabase } from '@/lib/supabase';

export default function TopProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSales, setTotalSales] = useState(0);

  useEffect(() => {
    fetchTopProducts();
  }, []);

  const fetchTopProducts = async () => {
    try {
      setLoading(true);

      // جلب بيانات المبيعات من order_items
      const { data: orderItemsData, error } = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          price,
          products (
            id,
            name,
            name_ar,
            price,
            stock,
            images,
            categories (
              name,
              name_ar
            )
          )
        `);

      if (error) throw error;

      // تجميع المبيعات حسب المنتج
      const productSalesMap = new Map();
      let totalSalesCount = 0;

      orderItemsData?.forEach(item => {
        const product = item.products as any;
        if (!product) return;

        const productId = item.product_id;
        totalSalesCount += item.quantity;

        if (productSalesMap.has(productId)) {
          const existing = productSalesMap.get(productId);
          existing.sales += item.quantity;
        } else {
          productSalesMap.set(productId, {
            id: productId,
            name: product.name_ar || product.name,
            price: product.price,
            sales: item.quantity,
            stock: product.stock,
            category: product.categories?.name_ar || product.categories?.name || 'عام',
            image: product.images?.[0] || null
          });
        }
      });

      // تحويل إلى مصفوفة وترتيب حسب المبيعات
      const sortedProducts = Array.from(productSalesMap.values())
        .sort((a, b) => b.sales - a.sales);

      setTopProducts(sortedProducts);
      setTotalSales(totalSalesCount);

    } catch (error) {
      console.error('Error fetching top products:', error);
      setTopProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = topProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0516] text-white overflow-x-hidden flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-purple-300">جاري تحميل المنتجات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0516] text-white overflow-x-hidden">
      {/* Background Decorations */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 bg-[#6236FF]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 bg-[#FF219D]" />
      </div>

      <FuturisticSidebar role="admin" />
      
      <div className="md:mr-[280px] transition-all duration-300 relative z-10">
        <FuturisticNavbar userName="" userRole="مدير" notificationCount={0} />
        
        <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10 max-w-[1800px] mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <button 
                  onClick={() => { if (typeof window !== 'undefined') window.history.back(); }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-purple-300" />
                </button>
                <h1 className="text-4xl font-bold text-white">المنتجات الأكثر مبيعاً</h1>
              </div>
              <p className="text-purple-200">تحليل أداء المنتجات الأعلى طلباً في المنصة</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-4 rounded-2xl border border-green-500/30 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-green-300">إجمالي المبيعات</p>
                  <p className="text-xl font-bold text-white">{totalSales.toLocaleString('ar-SA')} قطعة</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Filters Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          >
            <div className="relative md:col-span-2">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
              <input
                type="text"
                placeholder="ابحث عن منتج..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-4 rounded-2xl bg-white/5 border border-purple-500/30 focus:border-purple-500 focus:outline-none transition-all text-white placeholder:text-purple-300/50"
              />
            </div>
            <div className="relative">
              <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full pr-12 pl-4 py-4 rounded-2xl bg-white/5 border border-purple-500/30 focus:border-purple-500 focus:outline-none transition-all text-white appearance-none cursor-pointer"
              >
                <option value="all" className="bg-[#0F0A1E]">جميع التصنيفات</option>
                <option value="إلكترونيات" className="bg-[#0F0A1E]">إلكترونيات</option>
                <option value="موضة" className="bg-[#0F0A1E]">موضة</option>
                <option value="جمال" className="bg-[#0F0A1E]">جمال</option>
              </select>
            </div>
          </motion.div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <FuturisticProductCard
                key={product.id}
                {...product}
                delay={0.3 + index * 0.1}
              />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">لا توجد نتائج</h3>
              <p className="text-purple-300">لم نجد أي منتجات تطابق بحثك</p>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
