'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star, Heart, ShoppingCart } from 'lucide-react';
import type { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCurrency } from '@/contexts/CurrencyContext';

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
}

export default function ProductCard({ product, viewMode = 'grid' }: ProductCardProps) {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { selectedCurrency, formatPrice, convertPrice } = useCurrency();
  
  // تحويل السعر للعملة المختارة
  const displayPrice = convertPrice(product.price, product.original_currency || 'SAR');
  const displayOldPrice = product.oldPrice ? convertPrice(product.oldPrice, product.original_currency || 'SAR') : null;
  
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await addToCart(product.id, 1);
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isInWishlist(product.id)) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product.id);
    }
  };

  if (viewMode === 'list') {
    return (
      <Link href={`/products/${product.id}`} className="block">
        <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group">
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 p-4 md:p-6">
            <div className="relative w-full sm:w-32 h-32 rounded-xl overflow-hidden flex-shrink-0">
              <Image
                src={product.images[0] || '/placeholder.png'}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="flex-1">
              <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">
                {product.name}
              </h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
              <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="font-semibold text-gray-800">{product.rating}</span>
                  <span className="text-gray-500 text-sm">({product.reviews_count})</span>
                </div>
                <div className="text-gray-500 text-sm">
                  تم البيع: {product.total_sales}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl md:text-2xl font-bold text-gray-800">
                    {formatPrice(product.price, product.original_currency || 'SAR')}
                  </span>
                  {product.oldPrice && (
                    <span className="text-gray-400 line-through">
                      {formatPrice(product.oldPrice, product.original_currency || 'SAR')}
                    </span>
                  )}
                </div>
                <button 
                  onClick={handleAddToCart}
                  className="w-full sm:w-auto px-4 md:px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg text-white font-semibold transition-all flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
                  <span>أضف للسلة</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/products/${product.id}`} className="block group">
      <div className="bg-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden hover:scale-[1.02] md:hover:scale-105 h-full">
        {/* Product Image - Optimized aspect ratio for 2 columns */}
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={product.images[0] || '/placeholder.png'}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
          />
          {/* Discount Badge - Compact on mobile */}
          {displayOldPrice && (
            <div className="absolute top-2 md:top-4 right-2 md:right-4 px-1.5 md:px-3 py-0.5 md:py-1 bg-gradient-to-r from-red-500 to-pink-600 rounded-full text-white text-[10px] md:text-sm font-bold shadow-lg">
              {Math.round(((displayOldPrice - displayPrice) / displayOldPrice) * 100)}%
            </div>
          )}
          {/* Wishlist Button - Smaller on mobile */}
          <button 
            className="absolute top-2 md:top-4 left-2 md:left-4 p-1.5 md:p-2 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full transition-all hover:scale-110 shadow-md"
            onClick={handleToggleWishlist}
          >
            <Heart className={`w-3.5 h-3.5 md:w-5 md:h-5 transition-colors ${
              isInWishlist(product.id) 
                ? 'text-red-500 fill-red-500' 
                : 'text-gray-700 hover:text-red-500'
            }`} />
          </button>
          
          {/* Stock Badge */}
          {product.stock > 0 ? (
            <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-green-500/90 backdrop-blur-sm rounded-full text-white text-[9px] md:text-xs font-bold shadow-md flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
              متوفر
            </div>
          ) : (
            <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-red-500/90 backdrop-blur-sm rounded-full text-white text-[9px] md:text-xs font-bold shadow-md">
              نفذت الكمية
            </div>
          )}
        </div>

        {/* Product Info - Compact layout for mobile */}
        <div className="p-2.5 sm:p-3 md:p-6">
          {/* Product Name - Smaller on mobile, 2 lines max */}
          <h3 className="text-xs sm:text-sm md:text-lg font-bold text-gray-800 mb-1.5 md:mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors min-h-[2.5rem] sm:min-h-[2.75rem] md:min-h-[3.5rem] leading-tight">
            {product.name}
          </h3>
          
          {/* Rating - Compact */}
          <div className="flex items-center gap-1 mb-1.5 md:mb-3">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-2.5 h-2.5 md:w-4 md:h-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                />
              ))}
            </div>
            <span className="font-semibold text-gray-800 text-[10px] md:text-base">{product.rating}</span>
            <span className="text-gray-500 text-[9px] md:text-sm hidden sm:inline">({product.reviews_count})</span>
          </div>

          {/* Vendor Name - Hidden on mobile for space */}
          <div className="hidden sm:block text-xs md:text-sm text-gray-600 mb-2 md:mb-3 truncate">
            <span className="font-medium text-purple-600">{product.vendor_name}</span>
          </div>

          {/* Price - Prominent and responsive */}
          <div className="flex items-end justify-between mb-2 md:mb-4">
            <div>
              <div className="text-sm sm:text-lg md:text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
                {formatPrice(product.price, product.original_currency || 'SAR')}
              </div>
              {product.oldPrice && (
                <div className="text-[9px] sm:text-xs md:text-sm text-gray-400 line-through">
                  {formatPrice(product.oldPrice, product.original_currency || 'SAR')}
                </div>
              )}
            </div>
          </div>

          {/* Add to Cart Button - Full width, gradient on mobile */}
          <button 
            className="w-full py-2 md:py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg md:rounded-xl text-white font-bold transition-all flex items-center justify-center gap-1.5 md:gap-2 shadow-lg hover:shadow-xl text-xs md:text-base active:scale-95"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="w-3.5 h-3.5 md:w-5 md:h-5" />
            <span>أضف للسلة</span>
          </button>
        </div>
      </div>
    </Link>
  );
}
