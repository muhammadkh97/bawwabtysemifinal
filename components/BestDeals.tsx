'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ProductCard from './ProductCard';
import { Zap, Flame, TrendingUp, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  old_price?: number;
  original_currency?: string;
  images: string[];
  category: string;
  stock: number;
  rating: number;
  reviews_count: number;
  vendor_id: string;
  vendor_name: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  low_stock_threshold?: number;
  total_sales?: number;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  featured?: boolean;
}

export default function BestDeals() {
  const [deals, setDeals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBestDeals();
  }, []);

  const fetchBestDeals = async () => {
    try {
      setLoading(true);

      // جلب المنتجات التي لديها old_price (خصومات) - استثناء الوجبات من المطاعم
      const { data, error } = await supabase
        .from('products')
        .select('*, vendor:stores(store_name, business_type)')
        .not('old_price', 'is', null)
        .gt('stock', 0)
        .eq('is_active', true)
        .neq('vendor.business_type', 'restaurant')
        .order('rating', { ascending: false })
        .limit(8);

      if (error) throw error;

      // تحويل البيانات لإضافة vendor_name
      const productsWithVendor = (data || []).map(p => ({
        ...p,
        vendor_name: p.vendor?.store_name || 'Unknown'
      }));

      // ترتيب المنتجات حسب نسبة الخصم
      const sortedDeals = productsWithVendor.sort((a, b) => {
        const discountA = a.old_price ? ((a.old_price - a.price) / a.old_price) * 100 : 0;
        const discountB = b.old_price ? ((b.old_price - b.price) / b.old_price) * 100 : 0;
        return discountB - discountA;
      });

      setDeals(sortedDeals);
    } catch (error) {
      console.error('خطأ في جلب أفضل العروض:', error);
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3 mb-12">
            <Flame className="w-8 h-8 text-orange-600 animate-pulse" />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900">
              جاري التحميل...
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-white/50 aspect-square rounded-3xl mb-4"></div>
                <div className="h-6 bg-white/50 rounded-lg mb-3"></div>
                <div className="h-4 bg-white/50 rounded-lg w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (deals.length === 0) {
    return null;
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 relative overflow-hidden">
      {/* خلفية متحركة */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-orange-300 to-red-300 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-300 to-purple-300 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full blur-3xl opacity-10 animate-pulse delay-500"></div>
      </div>

      {/* شرارات متحركة */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* العنوان الفخم */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Flame className="w-10 h-10 sm:w-12 sm:h-12 text-orange-600 animate-bounce" />
            <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-500 fill-yellow-500 animate-pulse" />
            <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 text-red-600 animate-bounce delay-150" />
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black mb-4 bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
            🔥 أقوى العروض
          </h2>

          <p className="text-gray-700 text-lg sm:text-xl lg:text-2xl font-bold max-w-3xl mx-auto mb-6">
            خصومات حصرية تصل لـ 70% على منتجات مختارة!
          </p>

          <div className="flex items-center justify-center gap-3">
            <div className="h-1.5 w-24 bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 rounded-full animate-pulse"></div>
            <div className="px-6 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-full font-black text-sm shadow-xl animate-pulse">
              عرض محدود ⏰
            </div>
            <div className="h-1.5 w-24 bg-gradient-to-r from-pink-600 via-red-600 to-orange-600 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* شبكة المنتجات */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-10">
          {deals.map((product) => (
            <div key={product.id} className="group relative">
              {/* شعاع خلفي */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 -z-10"></div>
              
              {/* Badge الخصم الديناميكي */}
              {product.old_price && (
                <div className="absolute -top-4 -right-4 z-20">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-pink-600 rounded-full blur-md animate-pulse"></div>
                    <div className="relative bg-gradient-to-br from-red-500 to-pink-500 text-white px-5 py-2 rounded-full font-black text-lg shadow-2xl transform rotate-12 group-hover:rotate-0 transition-transform duration-300">
                      <span className="text-2xl">{Math.round(((product.old_price - product.price) / product.old_price) * 100)}%</span>
                      <span className="text-xs block">خصم</span>
                    </div>
                  </div>
                </div>
              )}
              
              <ProductCard product={product as any} />
            </div>
          ))}
        </div>

        {/* زر عرض جميع العروض */}
        <div className="text-center">
          <Link
            href="/deals"
            className="group inline-flex items-center gap-4 px-10 py-5 bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white rounded-3xl font-black text-xl shadow-2xl shadow-red-500/40 hover:shadow-red-500/60 transition-all duration-300 hover:scale-105 relative overflow-hidden"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
            <Flame className="w-7 h-7 relative z-10 group-hover:animate-bounce" />
            <span className="relative z-10">عرض جميع العروض الحصرية</span>
            <ChevronRight className="w-7 h-7 relative z-10 group-hover:translate-x-[-8px] transition-transform" />
          </Link>
        </div>

        {/* عداد تنازلي وهمي للإثارة */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border-2 border-red-200">
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <div className="text-4xl font-black text-red-600 mb-2">23</div>
                <div className="text-sm text-gray-600 font-bold">ساعة</div>
              </div>
              <div className="text-4xl text-red-600">:</div>
              <div className="text-center">
                <div className="text-4xl font-black text-red-600 mb-2">59</div>
                <div className="text-sm text-gray-600 font-bold">دقيقة</div>
              </div>
              <div className="text-4xl text-red-600">:</div>
              <div className="text-center">
                <div className="text-4xl font-black text-red-600 mb-2">45</div>
                <div className="text-sm text-gray-600 font-bold">ثانية</div>
              </div>
            </div>
            <p className="text-center mt-6 text-gray-700 font-bold text-lg">
              ⏰ لا تفوت الفرصة! العروض تنتهي قريباً
            </p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      ` }} />
    </section>
  );
}
