'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EmptyState from '@/components/EmptyState';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';

export default function WishlistPage() {
  const { user } = useAuth();
  const { wishlistItems, loading, removeFromWishlist } = useWishlist();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleRemoveItem = async (productId: string) => {
    await removeFromWishlist(productId);
    setSelectedItems(selectedItems.filter(id => id !== productId));
  };

  const handleToggleSelect = (productId: string) => {
    if (selectedItems.includes(productId)) {
      setSelectedItems(selectedItems.filter(id => id !== productId));
    } else {
      setSelectedItems([...selectedItems, productId]);
    }
  };

  const handleRemoveSelected = async () => {
    // Delete multiple items
    for (const productId of selectedItems) {
      await removeFromWishlist(productId);
    }
    setSelectedItems([]);
  };

  const handleAddToCartAll = async () => {
    const inStockItems = wishlistItems.filter(item => (item.product?.stock || 0) > 0);
    alert(`تمت إضافة ${inStockItems.length} منتج للسلة`);
  };

  const totalValue = wishlistItems.reduce((sum, item) => sum + (item.product?.price || 0), 0);
  const savings = wishlistItems.reduce((sum, item) => {
    const oldPrice = item.product?.old_price || item.product?.price || 0;
    const currentPrice = item.product?.price || 0;
    return sum + (oldPrice - currentPrice);
  }, 0);

  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-gray-50 py-4 md:py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-800 font-bold">جاري تحميل المفضلة...</p>
              </div>
            </div>
          )}

          {/* Not logged in */}
          {!loading && !user && (
            <div className="text-center py-20">
              <div className="text-6xl mb-6">🔒</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">يجب تسجيل الدخول</h2>
              <p className="text-gray-600 mb-8 text-lg">سجل الدخول لعرض قائمة المفضلة</p>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-purple-600 text-white font-bold text-lg hover:bg-purple-700 transition-colors"
              >
                تسجيل الدخول
              </Link>
            </div>
          )}

          {/* Empty Wishlist */}
          {!loading && user && wishlistItems.length === 0 && (
            <EmptyState type="wishlist" />
          )}

          {!loading && user && wishlistItems.length > 0 && (
            <>
              {/* Header */}
              <div className="mb-6 md:mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                  ❤️ قائمة المفضلة
                </h1>
                <p className="text-gray-600">{wishlistItems.length} منتج في قائمتك</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 md:mb-8">
                <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">إجمالي القيمة</p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-800">{totalValue} د.أ</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl p-4 md:p-6 shadow-sm">
                  <p className="text-sm opacity-90 mb-2">وفرت</p>
                  <p className="text-2xl md:text-3xl font-bold">{savings} د.أ</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl p-4 md:p-6 shadow-sm">
                  <p className="text-sm opacity-90 mb-2">متوفر حالياً</p>
                  <p className="text-2xl md:text-3xl font-bold">{wishlistItems.filter(item => (item.product?.stock || 0) > 0).length}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-xl p-4 shadow-sm mb-6 flex flex-wrap gap-3 border border-gray-200">
                <button
                  onClick={handleAddToCartAll}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 md:px-6 py-3 rounded-lg md:rounded-xl font-bold hover:shadow-lg transition-all"
                >
                  🛒 أضف الكل للسلة
                </button>
                {selectedItems.length > 0 && (
                  <button
                    onClick={handleRemoveSelected}
                    className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 md:px-6 py-3 rounded-lg md:rounded-xl font-bold hover:shadow-lg transition-all"
                  >
                    🗑️ حذف المحدد ({selectedItems.length})
                  </button>
                )}
              </div>

              {/* Wishlist Items */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {wishlistItems.map((item) => {
                  const inStock = (item.product?.stock || 0) > 0;
                  const oldPrice = item.product?.old_price;
                  const currentPrice = item.product?.price || 0;
                  
                  return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all border border-gray-200"
                  >
                    {/* Checkbox */}
                    <div className="absolute top-4 right-4 z-10">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.product_id)}
                        onChange={() => handleToggleSelect(item.product_id)}
                        className="w-6 h-6 cursor-pointer"
                      />
                    </div>

                    {/* Image */}
                    <Link href={`/products/${item.product_id}`} className="block">
                      <div className="relative h-56 md:h-64 bg-gradient-to-br from-purple-50 to-pink-50 overflow-hidden group">
                        {item.product?.images?.[0] ? (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name || 'منتج'}
                            fill
                            className="object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-gray-300 text-6xl">📦</div>
                          </div>
                        )}
                        
                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute bottom-4 left-0 right-0 text-center">
                            <span className="text-white font-bold text-lg">👁️ عرض المنتج</span>
                          </div>
                        </div>
                        
                        {/* Stock Badge */}
                        {!inStock && (
                          <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1.5 rounded-full text-xs md:text-sm font-bold shadow-lg backdrop-blur-sm">
                            ❌ نفذت الكمية
                          </div>
                        )}

                        {/* Discount Badge */}
                        {oldPrice && oldPrice > currentPrice && inStock && (
                          <div className="absolute top-3 left-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1.5 rounded-full text-xs md:text-sm font-bold shadow-lg">
                            🔥 وفر {Math.round(((oldPrice - currentPrice) / oldPrice) * 100)}%
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Content */}
                    <div className="p-4">
                      <p className="text-sm text-blue-600 font-bold mb-2">🏪 {item.product?.vendor_name || 'متجر'}</p>
                      
                      <Link href={`/products/${item.product_id}`}>
                        <h3 className="text-base md:text-lg font-bold text-gray-800 mb-2 hover:text-blue-600 transition-colors line-clamp-2">
                          {item.product?.name || 'منتج'}
                        </h3>
                      </Link>

                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-yellow-500">⭐</span>
                        <span className="font-bold text-gray-700">{item.product?.rating || 0}</span>
                      </div>

                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-xl md:text-2xl font-bold text-gray-800">{currentPrice} د.أ</span>
                        {oldPrice && oldPrice > currentPrice && (
                          <span className="text-base md:text-lg text-gray-500 line-through">{oldPrice} د.أ</span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Link
                          href={`/products/${item.product_id}`}
                          className={`flex-1 py-2 px-3 md:px-4 rounded-lg font-bold text-sm md:text-base text-center transition-all ${
                            inStock
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {inStock ? '🛒 أضف للسلة' : 'غير متوفر'}
                        </Link>
                        <button
                          onClick={() => handleRemoveItem(item.product_id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                          title="حذف من المفضلة"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </>
          )}
        
        {/* Bottom Padding for Mobile Nav */}
        <div className="h-20 md:h-0" />
      </div>
    </main>
      
    <Footer />
  </>
  );
}

