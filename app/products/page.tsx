'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { logger } from '@/lib/logger';
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
  const fetchCategories = useCallback(async () => {
    try {
      
      // جلب التصنيفات الرئيسية
      const { data: mainCats, error: fetchError } = await supabase
        .from('categories')
        .select('id, name, name_ar, is_active, parent_id')
        .is('parent_id', null)
        .order('display_order', { ascending: true });


      if (fetchError) {
        throw new Error(`فشل جلب التصنيفات: ${fetchError.message}`);
      }

      // فلترة التصنيفات النشطة فقط
      const activeCats = (mainCats || []).filter((cat: any) => cat.is_active === true);

      const formattedCategories = [
        { id: 'all', name: 'الكل' },
        ...activeCats.map((cat: any) => ({
          id: cat.id,
          name: cat.name_ar || cat.name
        }))
      ];

      setCategories(formattedCategories);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'خطأ في جلب التصنيفات';
      
      logger.error('fetchCategories failed', {
        error: errorMessage,
        component: 'ProductsPage',
      });
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Fetch subcategories when category changes
  const fetchSubcategories = useCallback(async () => {
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
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error fetching subcategories', { error: errorMessage, component: 'ProductsPage', selectedCategory });
      setSubcategories([]);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchSubcategories();
  }, [fetchSubcategories]);

  // Fetch products from Supabase
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('products')
        .select('*, categories!products_category_id_fkey(name, name_ar), vendors!inner(business_type)')
        .eq('status', 'approved')
        .neq('vendors.business_type', 'restaurant');

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
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error fetching products', { error: errorMessage, component: 'ProductsPage', selectedCategory, selectedSubcategory });
      setError('حدث خطأ في تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedSubcategory, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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
                    <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${selectedCategory === cat.id ? '-rotate-90' : 'opacity-0 group-hover:opacity-100'}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Subcategories */}
            {subcategories.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-2xl sm:rounded-[32px] p-4 sm:p-6">
                <h3 className="text-gray-900 font-bold mb-4 sm:mb-6 text-sm sm:text-base">التصنيفات الفرعية</h3>
                <div className="flex flex-wrap gap-2">
                  {subcategories.map(sub => (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubcategory(selectedSubcategory === sub.id ? '' : sub.id)}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all ${
                        selectedSubcategory === sub.id
                        ? 'bg-purple-100 text-purple-600 border-2 border-purple-600'
                        : 'bg-white text-gray-600 border-2 border-transparent hover:border-gray-200'
                      }`}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Sort & Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
              <p className="text-gray-500 text-sm sm:text-base">
                عرض <span className="text-gray-900 font-bold">{filteredProducts.length}</span> منتج
              </p>
              
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="text-gray-500 text-xs sm:text-sm font-bold whitespace-nowrap">ترتيب حسب:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-gray-700 outline-none focus:border-purple-500 transition-all"
                >
                  <option value="newest">الأحدث</option>
                  <option value="price-low">السعر: من الأقل للأعلى</option>
                  <option value="price-high">السعر: من الأعلى للأقل</option>
                  <option value="rating">الأعلى تقييماً</option>
                </select>
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className={`grid gap-4 sm:gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gray-50 rounded-2xl sm:rounded-[32px] aspect-[4/5] animate-pulse" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <EmptyState 
                type="products"
                title="لا توجد منتجات"
                description="لم نجد أي منتجات تطابق بحثك حالياً"
              />
            ) : (
              <div className={`grid gap-4 sm:gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                <AnimatePresence mode='popLayout'>
                  {filteredProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <Link href={`/products/${product.id}`}>
                        <div className={`group bg-white border border-gray-100 rounded-2xl sm:rounded-[32px] overflow-hidden hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 ${viewMode === 'list' ? 'flex flex-col sm:flex-row' : ''}`}>
                          {/* Image Container */}
                          <div className={`relative overflow-hidden bg-gray-50 ${viewMode === 'list' ? 'w-full sm:w-48 md:w-64 aspect-square sm:aspect-auto' : 'aspect-square'}`}>
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            
                            {/* Badges */}
                            <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex flex-col gap-2">
                              {product.old_price && (
                                <div className="bg-red-500 text-white text-[10px] sm:text-xs font-black px-2 sm:px-3 py-1 rounded-full shadow-lg">
                                  خصم {Math.round(((product.old_price - product.price) / product.old_price) * 100)}%
                                </div>
                              )}
                              {product.is_featured && (
                                <div className="bg-purple-600 text-white text-[10px] sm:text-xs font-black px-2 sm:px-3 py-1 rounded-full shadow-lg">
                                  مميز
                                </div>
                              )}
                            </div>

                            {/* Quick Actions */}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 sm:gap-3">
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  addToCart(product.id);
                                }}
                                className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center text-gray-900 hover:bg-purple-600 hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-300"
                              >
                                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                              </button>
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center text-gray-900 hover:bg-purple-600 hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-300 delay-75">
                                <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
                              </div>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-4 sm:p-6 flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-2 sm:mb-3">
                              <span className="text-purple-600 text-[10px] sm:text-xs font-black uppercase tracking-wider">{product.category}</span>
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-400 fill-current" />
                                <span className="text-gray-900 font-black text-[10px] sm:text-xs">{product.rating || 4.5}</span>
                              </div>
                            </div>
                            
                            <h3 className="text-gray-900 font-bold text-sm sm:text-base md:text-lg mb-2 sm:mb-3 line-clamp-2 group-hover:text-purple-600 transition-colors">
                              {product.name}
                            </h3>

                            <div className="mt-auto flex items-center justify-between gap-2 sm:gap-4">
                              <div className="flex flex-col">
                                <span className="text-lg sm:text-xl md:text-2xl font-black text-gray-900">{formatPrice(product.price)}</span>
                                {product.old_price && (
                                  <span className="text-xs sm:text-sm text-gray-400 line-through">{formatPrice(product.old_price)}</span>
                                )}
                              </div>
                              
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (isInWishlist(product.id)) {
                                    removeFromWishlist(product.id);
                                  } else {
                                    addToWishlist(product.id);
                                  }
                                }}
                                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all ${
                                  isInWishlist(product.id) 
                                  ? 'bg-red-50 text-red-500' 
                                  : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500'
                                }`}
                              >
                                <Star className={`w-5 h-5 sm:w-6 sm:h-6 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </Link>
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
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
