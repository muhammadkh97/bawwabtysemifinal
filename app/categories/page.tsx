'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Package, ChevronRight, ArrowLeft, Star, Zap, ShieldCheck, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Variant } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface Category {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  description?: string;
  icon?: string;
  products_count?: number;
  parent_id?: string;
  subcategories?: Category[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        // جلب التصنيفات الرئيسية مع عدد المنتجات
        const { data: mainCats, error: mainError } = await supabase
          .from('categories')
          .select('*, products_count:products(count)')
          .is('parent_id', null)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (mainError) throw mainError;

        // جلب التصنيفات الفرعية
        const { data: subCats, error: subError } = await supabase
          .from('categories')
          .select('*')
          .not('parent_id', 'is', null)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (subError) throw subError;

        // دمج التصنيفات الفرعية مع الرئيسية
        const formattedCategories = (mainCats || []).map(main => ({
          ...main,
          products_count: main.products_count?.[0]?.count || 0,
          subcategories: (subCats || []).filter(sub => sub.parent_id === main.id)
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
              تصفح الأقسام
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
              عالم من <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400 text-transparent bg-clip-text">الخيارات</span>
            </h1>
            <p className="text-purple-300/60 text-lg md:text-xl max-w-2xl mx-auto font-medium">
              اكتشف تشكيلتنا الواسعة من المنتجات المصنفة بعناية لتناسب احتياجاتك وتطلعاتك
            </p>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {[
            { icon: Zap, title: 'تصفح سريع', desc: 'تجربة تسوق سلسة وفائقة السرعة', color: 'text-yellow-400' },
            { icon: ShieldCheck, title: 'جودة مضمونة', desc: 'منتجات مختارة من أفضل الموردين', color: 'text-green-400' },
            { icon: TrendingUp, title: 'أحدث الصيحات', desc: 'دائماً نوفر لك كل ما هو جديد', color: 'text-blue-400' }
          ].map((feature, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-[32px] p-8 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group">
              <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${feature.color}`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-purple-300/40 text-sm font-medium">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white font-bold animate-pulse">جاري تحضير الأقسام...</p>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {categories.map((category) => (
              <motion.div
                key={category.id}
                variants={itemVariants}
                className="group relative bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-[40px] overflow-hidden hover:border-purple-500/50 transition-all duration-500"
              >
                <div className="p-8 md:p-10 flex flex-col md:flex-row gap-8">
                  {/* Category Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-4xl shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-500">
                        {category.icon || '📦'}
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-white mb-1 group-hover:text-purple-400 transition-colors">
                          {category.name_ar || category.name}
                        </h2>
                        <span className="text-xs font-black text-purple-400 uppercase tracking-widest">
                          {category.products_count || 0} منتج متاح
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-purple-300/60 mb-8 font-medium leading-relaxed line-clamp-2">
                      {category.description || `استكشف أفضل العروض والمنتجات في قسم ${category.name_ar || category.name} بجودة عالية وأسعار منافسة.`}
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
                        {category.subcategories.slice(0, 5).map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/products?category=${category.id}&subcategory=${sub.id}`}
                            className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 hover:bg-purple-500/10 transition-all group/sub"
                          >
                            <span className="text-sm font-bold text-purple-200 group-hover/sub:text-white transition-colors">
                              {sub.name_ar || sub.name}
                            </span>
                            <ChevronRight className="w-3 h-3 text-purple-500 opacity-0 group-hover/sub:opacity-100 transition-all" />
                          </Link>
                        ))}
                        {category.subcategories.length > 5 && (
                          <Link
                            href={`/products?category=${category.id}`}
                            className="block text-center py-2 text-[10px] font-black text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            + عرض {category.subcategories.length - 5} المزيد
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Decorative Elements */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl group-hover:bg-purple-600/20 transition-colors"></div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 p-12 rounded-[48px] bg-gradient-to-br from-purple-600 to-pink-600 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">هل أنت بائع؟</h2>
            <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto font-medium">
              انضم إلى آلاف البائعين في بوابتي وابدأ في تنمية تجارتك اليوم مع أدواتنا المتطورة
            </p>
            <Link
              href="/auth/register?role=vendor"
              className="inline-block px-10 py-5 bg-white text-purple-600 rounded-2xl font-black text-lg hover:scale-105 transition-transform shadow-2xl shadow-black/20"
            >
              ابدأ البيع الآن
            </Link>
          </div>
        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
}
