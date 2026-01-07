'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

interface Product {
  id: string;
  name_ar: string;
  name_en: string;
  price: number;
  old_price?: number;
  image_url: string;
  category: string;
  stock: number;
  rating?: number;
}

export default function SmartSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // البحث مع debounce - محسّن للأداء
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsSearching(true);
    setIsOpen(true);

    timeoutRef.current = setTimeout(async () => {
      try {
        // البحث في الاسم العربي والإنجليزي والوصف والفئة
        const { data, error } = await supabase
          .from('products')
          .select('id, name_ar, name_en, price, image_url, category, stock, old_price, rating')
          .or(`name_ar.ilike.%${query}%,name_en.ilike.%${query}%,description_ar.ilike.%${query}%,category.ilike.%${query}%`)
          .eq('is_active', true)
          .order('rating', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(8);

        if (error) throw error;
        setResults(data || []);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query]);

  // إغلاق عند الضغط خارج المكون
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      {/* شريط البحث */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
          placeholder="ابحث عن المنتجات..."
          className="w-full px-5 py-3 pr-12 pl-12 rounded-2xl text-white placeholder-gray-400 transition-all duration-300 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          style={{
            background: 'rgba(15, 10, 30, 0.6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(98, 54, 255, 0.3)'
          }}
        />
        
        {/* أيقونة البحث */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {isSearching ? (
            <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-purple-400" />
          )}
        </div>

        {/* زر المسح */}
        {query && (
          <button
            onClick={handleClear}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* نتائج البحث */}
      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 w-full rounded-3xl overflow-hidden z-[10002] shadow-2xl"
            style={{
              background: 'rgba(15, 10, 30, 0.95)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(98, 54, 255, 0.3)',
              maxHeight: '500px',
              overflowY: 'auto'
            }}
          >
            {results.map((product, index) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                onClick={() => {
                  setIsOpen(false);
                  setQuery('');
                }}
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 transition-all duration-300 flex items-center gap-4 border-b border-white/5 last:border-b-0 group cursor-pointer"
                >
                  {/* صورة المنتج */}
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 shadow-lg group-hover:shadow-purple-500/30 transition-shadow duration-300">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name_ar}
                        fill
                        className="object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <Search className="w-8 h-8" />
                      </div>
                    )}
                    
                    {/* Discount Badge على الصورة */}
                    {product.old_price && product.old_price > product.price && (
                      <div className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
                        -{Math.round(((product.old_price - product.price) / product.old_price) * 100)}%
                      </div>
                    )}
                  </div>

                  {/* معلومات المنتج */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 transition-all duration-300 truncate text-base">
                      {product.name_ar}
                    </h4>
                    
                    <div className="flex items-center gap-3 mt-1.5">
                      <p className="text-sm text-purple-300/70">📁 {product.category}</p>
                      
                      {/* Rating */}
                      {product.rating && product.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400 text-sm">⭐</span>
                          <span className="text-xs text-gray-300 font-bold">{product.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Stock Status */}
                    <div className="mt-1.5">
                      {product.stock > 5 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">
                          ✓ متوفر
                        </span>
                      )}
                      {product.stock <= 5 && product.stock > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-medium">
                          ⚠️ {product.stock} فقط
                        </span>
                      )}
                      {product.stock === 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium">
                          ✕ نفذت الكمية
                        </span>
                      )}
                    </div>
                  </div>

                  {/* السعر */}
                  <div className="text-left">
                    <div className="flex flex-col items-end">
                      <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                        {product.price.toFixed(2)} ر.س
                      </p>
                      {product.old_price && product.old_price > product.price && (
                        <p className="text-sm text-gray-500 line-through">
                          {product.old_price.toFixed(2)} ر.س
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}

            {/* عرض جميع النتائج - محسّن */}
            <Link href={`/products?search=${encodeURIComponent(query)}`}>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="p-4 text-center bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border-t border-white/10 cursor-pointer group transition-all duration-300"
                onClick={() => {
                  setIsOpen(false);
                  setQuery('');
                }}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                    🔍 عرض جميع النتائج
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 font-bold">
                    {results.length}+
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1 group-hover:text-gray-300 transition-colors">
                  اضغط لاستكشاف المزيد من المنتجات
                </p>
              </motion.div>
            </Link>
          </motion.div>
        )}

        {/* لا توجد نتائج */}
        {isOpen && !isSearching && query && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full rounded-3xl overflow-hidden z-[10002] shadow-2xl p-10 text-center"
            style={{
              background: 'rgba(15, 10, 30, 0.95)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(98, 54, 255, 0.3)'
            }}
          >
            <div className="inline-block p-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 mb-4">
              <Search className="w-16 h-16 text-purple-400" />
            </div>
            <h3 className="text-white text-xl font-bold mb-2">لم يتم العثور على نتائج</h3>
            <p className="text-gray-400 text-base mb-4">لا توجد منتجات تطابق بحثك عن &quot;<span className="text-purple-400 font-bold">{query}</span>&quot;</p>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-gray-400">💡 جرب كلمات أخرى</span>
              <span className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-gray-400">🔤 تحقق من الإملاء</span>
              <span className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-gray-400">🔍 استخدم مصطلحات أعم</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

