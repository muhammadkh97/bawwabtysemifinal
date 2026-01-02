'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Image from 'next/image';
import { Search, Filter, SlidersHorizontal, ChevronDown, Star, ShoppingCart, Eye, LayoutGrid, List } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import EmptyState from '@/components/EmptyState';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';

interface Product {
  id: string;
  name: string;
  price: number;
  old_price?: number;
  category: string;
  image_url?: string;
  rating?: number;
  reviews_count?: number;
  is_featured?: boolean;
  vendor_id?: string;
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams?.get('category') || 'all';
  const subcategoryFromUrl = searchParams?.get('subcategory') || '';
  const { formatPrice } = useCurrency();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl);
  const [selectedSubcategory, setSelectedSubcategory] = useState(subcategoryFromUrl);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string, subcategories?: any[]}[]>([{ id: 'all', name: 'الكل' }]);
  const [subcategories, setSubcategories] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories with subcategories from Supabase
  useEffect(() => {
    async function fetchCategories() {
      try {
        console.log('🔍 [Products Page] بدء جلب التصنيفات...');
        
        // جلب التصنيفات الرئيسية
        const { data: mainCats, error: fetchError } = await supabase
          .from('categories')
          .select('id, name, name_ar, is_active, parent_id')
          .is('parent_id', null)
          .order('display_order', { ascending: true });

        console.log('📊 [Products Page] نتيجة الاستعلام:', { mainCats, fetchError });

        if (fetchError) {
          console.error('❌ [Products Page] خطأ في جلب التصنيفات:', fetchError);
          throw fetchError;
        }

        // فلترة التصنيفات النشطة فقط
        const activeCats = (mainCats || []).filter((cat: any) => cat.is_active === true);
        console.log('✅ [Products Page] التصنيفات النشطة:', activeCats);

        const formattedCategories = [
          { id: 'all', name: 'الكل' },
          ...activeCats.map((cat: any) => ({
            id: cat.id,
            name: cat.name_ar || cat.name
          }))
        ];

        console.log('✅ [Products Page] التصنيفات المنسقة:', formattedCategories);
        setCategories(formattedCategories);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    }

    fetchCategories();
  }, []);

  // Fetch subcategories when category changes
  useEffect(() => {
    async function fetchSubcategories() {
      if (selectedCategory === 'all') {
        setSubcategories([]);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('categories')
          .select('id, name, name_ar')
          .eq('parent_id', selectedCategory)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (fetchError) throw fetchError;

        const formatted = (data || []).map((cat: any) => ({
          id: cat.id,
          name: cat.name_ar || cat.name
        }));

        setSubcategories(formatted);
      } catch (err) {
        console.error('Error fetching subcategories:', err);
        setSubcategories([]);
      }
    }

    fetchSubcategories();
  }, [selectedCategory]);

  // Fetch products from Supabase
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);
        
        let query = supabase
          .from('products')
          .select('*, categories!products_category_id_fkey(name, name_ar)')
          .eq('status', 'approved');

        // Apply category filter
        if (selectedCategory !== 'all') {
          query = query.eq('category_id', selectedCategory);
        }

        // Apply subcategory filter
        if (selectedSubcategory) {
          query = query.eq('subcategory_id', selectedSubcategory);
        }

        // Apply sorting
        switch (sortBy) {
          case 'newest':
            query = query.order('created_at', { ascending: false });
            break;
          case 'price-low':
            query = query.order('price', { ascending: true });
            break;
          case 'price-high':
            query = query.order('price', { ascending: false });
            break;
          case 'rating':
            query = query.order('rating', { ascending: false });
            break;
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        
        // Map products to ensure images field is used correctly
        const mappedProducts = (data || []).map((product: any) => ({
          ...product,
          category: product.categories?.name || product.categories?.name_ar || 'غير محدد',
          image_url: product.images?.[0] || product.featured_image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'
        }));
        
        setProducts(mappedProducts);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('حدث خطأ في تحميل المنتجات');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [selectedCategory, selectedSubcategory, sortBy]);

  useEffect(() => {
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [categoryFromUrl]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />
      
      <main className="pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-3 sm:px-4 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-2 sm:mb-3 md:mb-4 tracking-tight">
              {selectedCategory === 'all' ? 'جميع المنتجات' : categories.find(c => c.id === selectedCategory)?.name}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base md:text-lg">اكتشف أفضل العروض والمنتجات المختارة لك</p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex bg-gray-100 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border border-gray-200">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-gray-700'}`}
              >
                <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-all ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-gray-700'}`}
              >
                <List className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="lg:hidden flex items-center gap-1.5 sm:gap-2 bg-gray-100 border border-gray-200 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-gray-700 font-bold text-xs sm:text-sm"
            >
              <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
              فلترة
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Sidebar Filters */}
          <aside className={`lg:w-72 space-y-4 sm:space-y-6 lg:space-y-8 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
            {/* Search */}
            <div className="relative group">
              <Search className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
              <input 
                type="text"
                placeholder="ابحث عن منتج..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl py-3 sm:py-4 pr-10 sm:pr-12 pl-3 sm:pl-4 text-sm sm:text-base text-gray-900 focus:border-purple-500 outline-none transition-all"
              />
            </div>

            {/* Categories List */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl sm:rounded-[32px] p-4 sm:p-6">
              <h3 className="text-gray-900 font-bold mb-4 sm:mb-6 flex items-center gap-2 text-sm sm:text-base">
                <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500" />
                التصنيفات
              </h3>
              <div className="space-y-1.5 sm:space-y-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setSelectedSubcategory('');
                    }}
                    className={`w-full text-right px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all flex items-center justify-between group text-sm sm:text-base ${
                      selectedCategory === cat.id 
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="font-bold">{cat.name}</span>
                    {selectedCategory === cat.id && <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full"></div>}
                  </button>
                ))}
              </div>
              
              {/* التصنيفات الفرعية */}
              {subcategories.length > 0 && selectedCategory !== 'all' && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-gray-600 text-sm font-medium">الأقسام الفرعية</h4>
                    {selectedSubcategory && (
                      <button
                        onClick={() => setSelectedSubcategory('')}
                        className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                      >
                        إعادة تعيين
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {subcategories.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => setSelectedSubcategory(sub.id)}
                        className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between ${
                          selectedSubcategory === sub.id
                            ? 'bg-pink-500 text-white font-medium'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <span>• {sub.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sort By */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl sm:rounded-[32px] p-4 sm:p-6">
              <h3 className="text-gray-900 font-bold mb-3 sm:mb-4 text-sm sm:text-base">ترتيب حسب</h3>
              <div className="relative">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-900 appearance-none outline-none focus:border-purple-500"
                >
                  <option value="newest" className="bg-white">الأحدث أولاً</option>
                  <option value="price-low" className="bg-white">السعر: من الأقل</option>
                  <option value="price-high" className="bg-white">السعر: من الأعلى</option>
                  <option value="rating" className="bg-white">الأعلى تقييماً</option>
                </select>
                <ChevronDown className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-900 font-bold">جاري تحميل المنتجات...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="text-center py-20">
                <div className="text-red-500 text-lg font-bold mb-4">{error}</div>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                >
                  إعادة المحاولة
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredProducts.length === 0 && (
              <EmptyState 
                type={searchTerm ? 'search' : 'products'}
                description={searchTerm ? 'لم نجد منتجات تطابق بحثك. جرب كلمات أخرى!' : undefined}
              />
            )}

            {/* Premium Grid with 2 cols on mobile */}
            {!loading && !error && filteredProducts.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product, index) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      transition: {
                        delay: index * 0.05,
                        duration: 0.4,
                        ease: "easeOut"
                      }
                    }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ 
                      y: -8,
                      transition: { duration: 0.2 }
                    }}
                    key={product.id}
                    className="group relative bg-white border border-gray-200 rounded-2xl md:rounded-[32px] overflow-hidden hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500"
                  >
                    {/* Image Container - Optimized for mobile */}
                    <Link href={`/products/${product.id}`} className="relative aspect-square overflow-hidden block">
                      <Image 
                        src={product.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'} 
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-40"></div>
                      
                      {/* Quick Actions - Hidden on mobile, shown on hover on desktop */}
                      <div className="hidden sm:flex absolute top-3 md:top-4 left-3 md:left-4 flex-col gap-2 translate-x-[-120%] group-hover:translate-x-0 transition-transform duration-500">
                        <button 
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            await addToCart(product.id, 1);
                          }}
                          className="w-9 h-9 md:w-10 md:h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-purple-600 transition-colors shadow-lg"
                        >
                          <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        <Link
                          href={`/products/${product.id}`}
                          className="w-9 h-9 md:w-10 md:h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-purple-600 transition-colors shadow-lg"
                        >
                          <Eye className="w-4 h-4 md:w-5 md:h-5" />
                        </Link>
                      </div>

                      {/* Featured Badge - Smaller on mobile */}
                      {product.is_featured && (
                        <div className="absolute top-2 md:top-4 right-2 md:right-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[8px] md:text-[10px] font-black px-2 md:px-3 py-0.5 md:py-1 rounded-full uppercase tracking-widest shadow-lg">
                          مميز
                        </div>
                      )}

                      {/* Discount Badge */}
                      {product.old_price && (
                        <div className="absolute bottom-2 md:bottom-3 left-2 md:left-3 bg-red-500/90 backdrop-blur-sm text-white text-[10px] md:text-xs font-black px-2 py-1 rounded-lg shadow-lg">
                          {Math.round(((product.old_price - product.price) / product.old_price) * 100)}% خصم
                        </div>
                      )}
                    </Link>

                    {/* Content - Optimized for mobile */}
                    <div className="p-2.5 sm:p-4 md:p-6">
                      {/* Category & Rating - Responsive sizing */}
                      <div className="flex items-center justify-between mb-1.5 md:mb-2">
                        <span className="text-purple-600 text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-wider truncate max-w-[60%]">
                          {categories.find(c => c.id === product.category)?.name || product.category}
                        </span>
                        {product.rating && (
                          <div className="flex items-center gap-0.5 md:gap-1 bg-yellow-500/10 px-1.5 py-0.5 rounded-full">
                            <Star className="w-2.5 h-2.5 md:w-3 md:h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-gray-900 text-[10px] md:text-xs font-bold">{product.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Product Name - Smaller on mobile */}
                      <Link href={`/products/${product.id}`}>
                        <h3 className="text-xs sm:text-sm md:text-xl font-bold text-gray-900 mb-2 md:mb-4 group-hover:text-purple-600 transition-colors line-clamp-2 md:line-clamp-1 leading-tight">
                          {product.name}
                        </h3>
                      </Link>

                      {/* Price & Actions - Compact on mobile */}
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex flex-col">
                          <span className="text-sm sm:text-lg md:text-2xl font-black text-gray-900 leading-tight">{formatPrice(product.price)}</span>
                          {product.old_price && (
                            <span className="text-[9px] sm:text-[10px] md:text-sm text-gray-400 line-through">{product.old_price} ₪</span>
                          )}
                        </div>
                        <button 
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            await addToCart(product.id, 1);
                          }}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 sm:bg-gray-100 sm:hover:bg-purple-600 border border-transparent sm:border-gray-200 sm:hover:border-purple-500 p-2 md:p-3 rounded-xl md:rounded-2xl text-white sm:text-gray-700 sm:hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                          <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Premium Shine Effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    </div>
                  </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0515] flex items-center justify-center text-white font-bold">جاري التحميل...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
