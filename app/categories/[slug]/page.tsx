'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { Filter, Grid, List, Package, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { Product, Category } from '@/types';
import { getCategoryBySlug, getProductsByCategory } from '@/lib/api';

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('popular');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadCategoryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function loadCategoryData() {
    setLoading(true);
    
    // جلب بيانات التصنيف
    const { data: categoryData } = await getCategoryBySlug(slug);
    if (categoryData) {
      setCategory(categoryData);
      
      // جلب المنتجات
      const { data: productsData } = await getProductsByCategory(categoryData.id);
      if (productsData) {
        setProducts(productsData);
      }
    }
    
    setLoading(false);
  }

  const filteredProducts = products
    .filter(p => p.price >= priceRange.min && p.price <= priceRange.max)
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'rating': return b.rating - a.rating;
        case 'newest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default: return b.total_sales - a.total_sales; // popular
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900" dir="rtl">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <Package className="w-24 h-24 text-white/30 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">التصنيف غير موجود</h1>
          <Link href="/categories" className="text-purple-300 hover:text-white">
            العودة إلى التصنيفات
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900" dir="rtl">
      <Header />
      
      <main className="container mx-auto px-4 py-12 mt-20">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-purple-300 mb-6">
          <Link href="/" className="hover:text-white">الرئيسية</Link>
          <span>/</span>
          <Link href="/categories" className="hover:text-white">التصنيفات</Link>
          <span>/</span>
          <span className="text-white">{category.name}</span>
        </div>

        {/* Category Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 mb-8 border border-white/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{category.name}</h1>
              <p className="text-purple-200">{products.length} منتج متاح</p>
            </div>
            <Link
              href="/categories"
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
            >
              <ArrowRight className="w-5 h-5" />
              <span>كل التصنيفات</span>
            </Link>
          </div>
        </div>

        {/* Filters and Sort Bar */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-purple-600 text-white' 
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list' 
                    ? 'bg-purple-600 text-white' 
                    : 'text-purple-300 hover:text-white'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-all"
              >
                <Filter className="w-5 h-5" />
                <span>تصفية</span>
              </button>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white border border-white/10 focus:outline-none focus:border-purple-500"
              >
                <option value="popular">الأكثر شعبية</option>
                <option value="newest">الأحدث</option>
                <option value="price-asc">السعر: من الأقل للأعلى</option>
                <option value="price-desc">السعر: من الأعلى للأقل</option>
                <option value="rating">الأعلى تقييماً</option>
              </select>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Price Range */}
                <div>
                  <label className="block text-white font-semibold mb-3">نطاق السعر</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      placeholder="من"
                    />
                    <span className="text-white">-</span>
                    <input
                      type="number"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      placeholder="إلى"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Products Grid/List */}
        {filteredProducts.length > 0 ? (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} viewMode={viewMode} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Package className="w-24 h-24 text-white/30 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">لا توجد منتجات</h3>
            <p className="text-purple-200 mb-6">جرب تغيير إعدادات التصفية</p>
            <button
              onClick={() => {
                setPriceRange({ min: 0, max: 10000 });
                setSortBy('popular');
              }}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-semibold transition-all"
            >
              إعادة تعيين التصفية
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
