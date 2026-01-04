'use client'

import { useRestaurantCart } from '@/contexts/RestaurantCartContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { UtensilsCrossed, Plus, Minus, Trash2, Clock, ShoppingBag, Store, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

export default function RestaurantCartPage() {
  const { 
    restaurantCartItems, 
    restaurantCartTotal, 
    restaurantItemsCount,
    removeFromRestaurantCart,
    updateRestaurantCartQuantity,
    updateSpecialInstructions,
    clearRestaurantCart,
    isLoading
  } = useRestaurantCart()

  const { formatPrice, selectedCurrency } = useCurrency()
  const [editingInstructions, setEditingInstructions] = useState<string | null>(null)
  const [instructionsText, setInstructionsText] = useState<string>('')

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      if (confirm('هل تريد حذف هذا العنصر من السلة؟')) {
        await removeFromRestaurantCart(itemId)
      }
    } else {
      await updateRestaurantCartQuantity(itemId, newQuantity)
    }
  }

  const handleSaveInstructions = async (itemId: string) => {
    await updateSpecialInstructions(itemId, instructionsText)
    setEditingInstructions(null)
    setInstructionsText('')
  }

  const startEditingInstructions = (itemId: string, currentInstructions?: string) => {
    setEditingInstructions(itemId)
    setInstructionsText(currentInstructions || '')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل سلة المطاعم...</p>
        </div>
      </div>
    )
  }

  if (restaurantCartItems.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl shadow-lg p-8 md:p-12 text-center">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mb-6">
              <UtensilsCrossed className="w-12 h-12 text-orange-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              سلة المطاعم فارغة
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              لم تقم بإضافة أي وجبات من المطاعم بعد
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/restaurants"
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-bold hover:shadow-xl transition-all"
              >
                <span className="flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5" />
                  تصفح المطاعم
                </span>
              </Link>
              <Link
                href="/"
                className="px-8 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all"
              >
                العودة للرئيسية
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 bg-gradient-to-b from-orange-50 to-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-white" />
              </div>
              سلة المطاعم
            </h1>
            <p className="text-gray-600 mt-2">
              لديك {restaurantItemsCount} {restaurantItemsCount === 1 ? 'عنصر' : 'عناصر'} في سلة المطاعم
            </p>
          </div>
          <button
            onClick={() => {
              if (confirm('هل تريد إفراغ سلة المطاعم بالكامل؟')) {
                clearRestaurantCart()
              }
            }}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-all flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            إفراغ السلة
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {/* معلومة التوصيل السريع */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl p-4 flex items-center gap-3">
              <Clock className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="font-bold">توصيل سريع - خلال 30-60 دقيقة</p>
                <p className="text-sm text-orange-50">جميع طلبات المطاعم يتم توصيلها بشكل فوري</p>
              </div>
            </div>

            {restaurantCartItems.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all">
                <div className="p-6">
                  {/* Restaurant Info */}
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                    {item.restaurant_logo && (
                      <Image
                        src={item.restaurant_logo}
                        alt={item.restaurant_name || 'المطعم'}
                        width={40}
                        height={40}
                        className="rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-orange-500" />
                        <span className="font-bold text-gray-900">{item.restaurant_name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex gap-4">
                    {item.product?.images?.[0] && (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name_ar || item.product.name || 'المنتج'}
                        width={120}
                        height={120}
                        className="rounded-xl object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 mb-2">
                        {item.product?.name_ar || item.product?.name}
                      </h3>
                      <p className="text-orange-600 font-bold text-xl mb-3">
                        {formatPrice(item.product?.price || 0)}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-sm text-gray-600">الكمية:</span>
                        <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-all"
                          >
                            <Minus className="w-4 h-4 text-gray-700" />
                          </button>
                          <span className="w-12 text-center font-bold text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-all"
                          >
                            <Plus className="w-4 h-4 text-gray-700" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromRestaurantCart(item.id)}
                          className="mr-auto p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Special Instructions */}
                      <div className="mt-3">
                        {editingInstructions === item.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={instructionsText}
                              onChange={(e) => setInstructionsText(e.target.value)}
                              placeholder="مثال: بدون بصل، إضافة جبن، طبخ جيداً..."
                              className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveInstructions(item.id)}
                                className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-all"
                              >
                                حفظ
                              </button>
                              <button
                                onClick={() => setEditingInstructions(null)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200 transition-all"
                              >
                                إلغاء
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {item.special_instructions ? (
                              <div className="bg-orange-50 p-3 rounded-lg">
                                <p className="text-sm text-gray-700 mb-2">
                                  <strong>ملاحظات خاصة:</strong> {item.special_instructions}
                                </p>
                                <button
                                  onClick={() => startEditingInstructions(item.id, item.special_instructions)}
                                  className="text-sm text-orange-600 hover:text-orange-700 font-bold"
                                >
                                  تعديل الملاحظات
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEditingInstructions(item.id)}
                                className="text-sm text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1"
                              >
                                <Plus className="w-4 h-4" />
                                إضافة ملاحظات خاصة
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Item Subtotal */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">المجموع الفرعي:</span>
                          <span className="font-bold text-lg text-gray-900">
                            {formatPrice((item.product?.price || 0) * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-black text-gray-900 mb-6">ملخص الطلب</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-700">
                  <span>المجموع الفرعي:</span>
                  <span className="font-bold">{formatPrice(restaurantCartTotal)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>رسوم التوصيل السريع:</span>
                  <span className="font-bold text-orange-600">5.00 {selectedCurrency}</span>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-lg font-black text-gray-900">
                    <span>المجموع الكلي:</span>
                    <span className="text-orange-600">
                      {formatPrice(restaurantCartTotal + 5)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <p className="font-bold text-orange-700 mb-1">توصيل سريع</p>
                    <p>سيتم توصيل طلبك خلال 30-60 دقيقة من تأكيد الطلب</p>
                  </div>
                </div>
              </div>

              <Link
                href="/checkout?type=restaurant"
                className="block w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-center rounded-2xl font-black text-lg hover:shadow-xl transition-all"
              >
                <span className="flex items-center justify-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  إتمام الطلب
                </span>
              </Link>

              <Link
                href="/categories/restaurants"
                className="block w-full mt-3 py-3 bg-gray-100 text-gray-700 text-center rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                إضافة المزيد
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
