'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Package, ChevronRight, ArrowLeft, Star, Zap, ShieldCheck, TrendingUp, Smartphone, Shirt, Home, ShoppingBasket, Sparkles, UtensilsCrossed, Box } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Category } from '@/types';

const iconMap: { [key: string]: any } = {
  'Smartphone': Smartphone,
  'Shirt': Shirt,
  'Home': Home,
  'ShoppingBasket': ShoppingBasket,
  'Sparkles': Sparkles,
  'UtensilsCrossed': UtensilsCrossed,
  'Box': Box,
  'Laptop': Smartphone, // Fallback
  'Headphones': Smartphone,
  'Camera': Smartphone,
  'User': Shirt,
  'Baby': Shirt,
  'Footprints': Shirt,
  'Watch': Shirt,
  'Armchair': Home,
  'Utensils': Home,
  'Palette': Home,
  'Tv': Home,
  'Apple': ShoppingBasket,
  'Coffee': ShoppingBasket,
  'Container': ShoppingBasket,
  'Croissant': ShoppingBasket,
  'Smile': Sparkles,
  'Heart': Sparkles,
  'Wind': Sparkles,
  'UserCheck': Sparkles,
  'Pizza': UtensilsCrossed,
  'Soup': UtensilsCrossed,
  'IceCream': UtensilsCrossed,
  'Salad': UtensilsCrossed,
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        // جلب جميع التصنيفات النشطة
        const { data, error } = await supabase
          .from('categories')
          .select('*, products_count:products(count)')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) throw error;

        // تنظيم البيانات في هيكل شجري
        const mainCategories = data.filter(cat => !cat.parent_id);
        const subCategories = data.filter(cat => cat.parent_id);

        const formattedCategories = mainCategories.map(main => ({
          ...main,
          productsCount: main.products_count?.[0]?.count || 0,
          subcategories: subCategories
            .filter(sub => sub.parent_id === main.id)
            .map(sub => ({
              ...sub,
              productsCount: sub.products_count?.[0]?.count || 0
            }))
        }));

        setCategories(formattedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0515]" dir="rtl">
      <Header />
      
      <main className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="relative mb-20 text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-600/20 rounded-full blur-[120px] -z-10"></div>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-black uppercase tracking-widest mb-6">
              تصفح الأقسام الاحترافية
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
              عالم من <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400 text-transparent bg-clip-text">الخيارات</span>
            </h1>
            <p className="text-purple-300/60 text-lg md:text-xl max-w-2xl mx-auto font-medium">
              اكتشف نظام التصنيفات الجديد والمطور، المصمم خصيصاً ليسهل عليك الوصول لما تريد
            </p>
          </motion.div>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white font-bold animate-pulse">جاري تحضير الأقسام الجديدة...</p>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {categories.map((category) => {
              const IconComponent = iconMap[category.icon || 'Box'] || Box;
              return (
                <motion.div
                  key={category.id}
                  variants={itemVariants}
                  className="group relative bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-[40px] overflow-hidden hover:border-purple-500/50 transition-all duration-500"
                >
                  <div className="p-8 md:p-10 flex flex-col md:flex-row gap-8">
                    {/* Category Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-500">
                          <IconComponent className="w-8 h-8" />
                        </div>
                        <div>
                          <h2 className="text-3xl font-black text-white mb-1 group-hover:text-purple-400 transition-colors">
                            {category.name_ar}
                          </h2>
                          <span className="text-xs font-black text-purple-400 uppercase tracking-widest">
                            {category.productsCount || 0} منتج متاح
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-purple-300/60 mb-8 font-medium leading-relaxed line-clamp-2">
                        {category.description_ar || category.description || `استكشف أفضل العروض والمنتجات في قسم ${category.name_ar} بجودة عالية وأسعار منافسة.`}
                      </p>

                      <Link
                        href={`/products?category=${category.id}`}
                        className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl font-black text-sm hover:bg-purple-600 hover:text-white transition-all duration-300 group/btn"
                      >
                        تسوق الآن
                        <ArrowLeft className="w-4 h-4 group-hover/btn:-translate-x-2 transition-transform" />
                      </Link>
                    </div>

                    {/* Subcategories List */}
                    {category.subcategories && category.subcategories.length > 0 && (
                      <div className="md:w-48 shrink-0">
                        <h3 className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-4">الأقسام الفرعية</h3>
                        <div className="space-y-2">
                          {category.subcategories.map((sub) => (
                            <Link
                              key={sub.id}
                              href={`/products?category=${category.id}&subcategory=${sub.id}`}
                              className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 hover:bg-purple-500/10 transition-all group/sub"
                            >
                              <span className="text-sm font-bold text-purple-200 group-hover/sub:text-white transition-colors">
                                {sub.name_ar}
                              </span>
                              <ChevronRight className="w-3 h-3 text-purple-500 opacity-0 group-hover/sub:opacity-100 transition-all" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl group-hover:bg-purple-600/20 transition-colors"></div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
