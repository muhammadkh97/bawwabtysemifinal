'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, ShoppingCart, Heart, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';

interface Product {
  id: string;
  name: string;
  price: number;
  old_price: number | null;
  images: string[];
  featured_image: string | null;
  vendor_id: string;
  vendors: {
    shop_name: string;
  } | null;
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrency();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  async function fetchFeaturedProducts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          old_price,
          images,
          featured_image,
          vendor_id,
          vendors!inner(vendor_type)
        `)
        .eq('status', 'approved')
        .neq('vendors.vendor_type', 'restaurant')
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;

      // Fetch vendor names separately
      const productsWithVendors = await Promise.all(
        (data || []).map(async (product) => {
          const { data: vendorData } = await supabase
            .from('stores')
            .select('shop_name')
            .eq('id', product.vendor_id)
            .single();

          return {
            ...product,
            vendors: vendorData
          };
        })
      );

      setProducts(productsWithVendors);
    } catch (error) {
      console.error('Error fetching featured products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }
  return (
    <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-white">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 md:mb-12 gap-3 sm:gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-1 sm:mb-2 text-gray-900 tracking-tight">
              المنتجات المميزة ⭐
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600">أفضل المنتجات المختارة لك</p>
          </div>
          <Link
            href="/products"
            className="px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 text-white rounded-xl sm:rounded-2xl hover:shadow-2xl transition-all font-bold transform hover:scale-105 text-xs sm:text-sm md:text-base whitespace-nowrap bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 w-full sm:w-auto text-center"
          >
            عرض جميع المنتجات
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-900 font-bold">جاري تحميل المنتجات...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl text-gray-600 mb-4">لا توجد منتجات متاحة حالياً</p>
            <p className="text-gray-400">سيتم إضافة منتجات جديدة قريباً</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {products.map((product, index) => {
              const productImage = product.images?.[0] || product.featured_image || '/placeholder.png';
              const vendorName = product.vendors?.shop_name || 'بائع غير معروف';
              const discount = product.old_price 
                ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
                : 0;

              return (
                <div
                  key={product.id}
                  className="group relative bg-white border border-gray-200 rounded-xl sm:rounded-2xl md:rounded-[32px] overflow-hidden hover:border-purple-500 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500"
                >
                  {/* Image Container */}
                  <Link href={`/products/${product.id}`} className="block">
                    <div className="relative aspect-square overflow-hidden">
                      <img 
                        src={productImage} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-40"></div>
                      
                      {/* Discount Badge */}
                      {product.old_price && (
                        <div className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full text-[10px] sm:text-xs md:text-sm font-bold shadow-lg">
                          {discount}% خصم
                        </div>
                      )}
                      
                      {/* Quick Actions - Hidden on mobile */}
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
                        <button 
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (isInWishlist(product.id)) {
                              await removeFromWishlist(product.id);
                            } else {
                              await addToWishlist(product.id);
                            }
                          }}
                          className={`w-9 h-9 md:w-10 md:h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors shadow-lg ${
                            isInWishlist(product.id) ? 'text-pink-500' : 'text-white'
                          }`}
                        >
                          <Heart className={`w-4 h-4 md:w-5 md:h-5 ${isInWishlist(product.id) ? 'fill-pink-500' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </Link>

                  {/* Content */}
                  <div className="p-2 sm:p-3 md:p-6">
                    <Link href={`/products/${product.id}`}>
                      {/* Vendor Badge */}
                      <div className="inline-block px-1.5 sm:px-2 md:px-3 py-0.5 md:py-1 bg-purple-100 border border-purple-200 rounded-full mb-1 sm:mb-2">
                        <span className="text-[9px] sm:text-[10px] md:text-xs text-purple-600 font-medium line-clamp-1">{vendorName}</span>
                      </div>

                      {/* Product Name */}
                      <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-gray-900 mb-1 sm:mb-2 md:mb-3 line-clamp-2 group-hover:text-purple-600 transition-colors">
                        {product.name}
                      </h3>

                      {/* Rating */}
                      <div className="flex items-center gap-0.5 sm:gap-1 mb-1 sm:mb-2 md:mb-3">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-yellow-400 fill-yellow-400" />
                          ))}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline gap-1 sm:gap-2 mb-2 sm:mb-3 md:mb-4">
                        <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                          {formatPrice(product.price)}
                        </span>
                        {product.old_price && (
                          <span className="text-[10px] sm:text-xs md:text-sm text-gray-400 line-through">{formatPrice(product.old_price)}</span>
                        )}
                      </div>
                    </Link>

                    {/* Mobile Actions */}
                    <div className="flex sm:hidden gap-1.5 sm:gap-2">
                      <button 
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          await addToCart(product.id, 1);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 sm:py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs"
                      >
                        <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>أضف للسلة</span>
                      </button>
                      <button 
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (isInWishlist(product.id)) {
                            await removeFromWishlist(product.id);
                          } else {
                            await addToWishlist(product.id);
                          }
                        }}
                        className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-colors ${
                          isInWishlist(product.id)
                            ? 'bg-pink-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-pink-600 hover:text-white'
                        }`}
                      >
                        <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${isInWishlist(product.id) ? 'fill-white' : ''}`} />
                      </button>
                    </div>

                    {/* Desktop Add to Cart Button */}
                    <button 
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        await addToCart(product.id, 1);
                      }}
                      className="hidden sm:flex w-full items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2.5 lg:py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white rounded-xl hover:shadow-xl transition-all font-bold transform hover:scale-105 text-xs sm:text-sm md:text-base"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                      <span>أضف للسلة</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

