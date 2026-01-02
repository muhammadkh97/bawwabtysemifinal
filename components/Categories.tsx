'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package } from 'lucide-react';
import type { Category } from '@/types';
import { getPopularCategories } from '@/lib/api';

export default function Categories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    const { data, error } = await getPopularCategories(8);
    if (data) {
      setCategories(data);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <section className="py-12 md:py-20 bg-gradient-to-b from-purple-50 to-white">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-600 mx-auto"></div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 md:mb-4" style={{ 
            background: 'linear-gradient(90deg, #6236FF 0%, #B621FE 50%, #FF219D 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            تسوق حسب الفئة
          </h2>
          <p className="text-sm sm:text-base md:text-xl text-gray-600">اختر من بين مجموعة واسعة من الفئات</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group relative overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 sm:hover:-translate-y-2"
            >
              <div className="relative h-40 sm:h-48 md:h-56 lg:h-72">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Package className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 text-white/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/90 via-purple-600/50 to-transparent" />
                <div className="absolute bottom-0 right-0 left-0 p-3 sm:p-4 md:p-6 text-white">
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold mb-1 sm:mb-2 line-clamp-1">{category.name}</h3>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-[10px] sm:text-xs md:text-sm bg-white/20 backdrop-blur px-1.5 sm:px-2 md:px-3 py-0.5 md:py-1 rounded-full">
                      {category.productsCount || 0} منتج
                    </span>
                    <span className="text-sm sm:text-base md:text-lg lg:text-xl">→</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-6 sm:mt-8 md:mt-12">
          <Link
            href="/categories"
            className="inline-block px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl sm:rounded-2xl text-white font-bold text-sm sm:text-base md:text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
          >
            عرض جميع التصنيفات
          </Link>
        </div>
      </div>
    </section>
  );
}


