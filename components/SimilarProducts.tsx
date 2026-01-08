'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ProductCard from './ProductCard';
import { Sparkles, ChevronRight } from 'lucide-react';
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

interface SimilarProductsProps {
  currentProductId: string;
  category: string;
  vendorId?: string;
}

export default function SimilarProducts({ currentProductId, category, vendorId }: SimilarProductsProps) {
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSimilarProducts();
  }, [currentProductId, category, vendorId]);

  const fetchSimilarProducts = async () => {
    try {
      setLoading(true);

      // أولاً: منتجات من نفس البائع
      let query = supabase
        .from('products')
        .select('*, vendor:stores(store_name)')
        .eq('category', category)
        .neq('id', currentProductId)
        .gt('stock', 0)
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(8);

      // إذا كان هناك بائع، نعطي الأولوية لمنتجاته
      if (vendorId) {
        const { data: vendorProducts, error: vendorError } = await query.eq('vendor_id', vendorId);
        
        if (vendorError) throw vendorError;

        // إضافة vendor_name
        const vendorProductsWithName = (vendorProducts || []).map(p => ({
          ...p,
          vendor_name: p.vendor?.store_name || 'Unknown'
        }));

        // إذا وجدنا منتجات من نفس البائع
        if (vendorProductsWithName && vendorProductsWithName.length >= 4) {
          setSimilarProducts(vendorProductsWithName);
          setLoading(false);
          return;
        }

        // إضافة منتجات البائع إلى القائمة إن وجدت
        if (vendorProductsWithName && vendorProductsWithName.length > 0) {
          // جلب منتجات أخرى من نفس التصنيف
          const { data: categoryProducts, error: categoryError } = await supabase
            .from('products')
            .select('*, vendor:stores(store_name)')
            .eq('category', category)
            .neq('id', currentProductId)
            .neq('vendor_id', vendorId)
            .gt('stock', 0)
            .eq('is_active', true)
            .order('rating', { ascending: false })
            .limit(8 - vendorProductsWithName.length);

          if (categoryError) throw categoryError;

          // إضافة vendor_name
          const categoryProductsWithName = (categoryProducts || []).map(p => ({
            ...p,
            vendor_name: p.vendor?.store_name || 'Unknown'
          }));

          // دمج المنتجات
          const combined = [...vendorProductsWithName, ...categoryProductsWithName];
          setSimilarProducts(combined);
          setLoading(false);
          return;
        }
      }

      // إذا لم نجد منتجات من نفس البائع، نجلب من نفس التصنيف
      const { data: products, error } = await query;
      
      if (error) throw error;

      // تحويل البيانات لإضافة vendor_name
      const productsWithVendor = (products || []).map(p => ({
        ...p,
        vendor_name: p.vendor?.store_name || 'Unknown'
      }));
      
      setSimilarProducts(productsWithVendor);
    } catch (error) {
      console.error('خطأ في جلب المنتجات المشابهة:', error);
      setSimilarProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-white via-purple-50/30 to-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3 mb-12">
            <Sparkles className="w-8 h-8 text-purple-600 animate-pulse" />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              جاري التحميل...
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-square rounded-3xl mb-4"></div>
                <div className="h-6 bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 rounded-lg w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (similarProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-white via-purple-50/30 to-white relative overflow-hidden">
      {/* خلفية ديكورية */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-200 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* العنوان */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-1 w-16 bg-gradient-to-r from-transparent via-purple-600 to-transparent rounded-full"></div>
            <Sparkles className="w-8 h-8 text-purple-600 animate-spin-slow" />
            <div className="h-1 w-16 bg-gradient-to-r from-transparent via-pink-600 to-transparent rounded-full"></div>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            ✨ منتجات قد تعجبك
          </h2>
          
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            اكتشف منتجات مشابهة مختارة خصيصاً لك
          </p>

          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="h-1 w-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"></div>
            <Sparkles className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <div className="h-1 w-20 bg-gradient-to-r from-pink-600 to-blue-600 rounded-full"></div>
          </div>
        </div>

        {/* شبكة المنتجات */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {similarProducts.map((product) => (
            <ProductCard key={product.id} product={product as any} />
          ))}
        </div>

        {/* زر عرض المزيد */}
        <div className="text-center">
          <Link
            href={`/products?category=${category}`}
            className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
          >
            <span>عرض المزيد من المنتجات</span>
            <ChevronRight className="w-6 h-6 group-hover:translate-x-[-4px] transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
