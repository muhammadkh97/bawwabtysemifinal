'use client'

import { Package, ShoppingCart, DollarSign, TrendingUp, Star, Clock } from 'lucide-react'

export default function VendorDashboard() {
  const stats: any[] = [];
  const recentOrders: any[] = [];
  const topProducts: any[] = [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">نظرة عامة</h1>
        <p className="text-gray-600 mt-2">مرحباً بك في لوحة التحكم الخاصة بك</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1">{stat.change}</p>
                </div>
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">الطلبات الأخيرة</h2>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
              عرض الكل
            </button>
          </div>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">{order.id}</p>
                  <p className="text-sm text-gray-600">{order.product} × {order.quantity}</p>
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">{order.total}</p>
                  <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-600 rounded">
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">المنتجات الأكثر مبيعاً</h2>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center gap-4">
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-600">{product.sales} مبيعة</p>
                </div>
                <p className="font-bold text-gray-900">{product.revenue}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Wallet Summary */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100">الرصيد المتاح للسحب</p>
            <p className="text-4xl font-bold mt-2">12,450 ر.س</p>
            <button className="mt-4 px-6 py-2 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors">
              طلب سحب
            </button>
          </div>
          <div className="text-left">
            <p className="text-green-100">العمولة المحسوبة</p>
            <p className="text-2xl font-bold mt-2">4,528 ر.س (10%)</p>
            <p className="text-sm text-green-100 mt-2">من إجمالي المبيعات</p>
          </div>
        </div>
      </div>

      {/* Actions Needed */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-6 h-6 text-orange-500" />
          <h2 className="text-xl font-bold text-gray-900">إجراءات مطلوبة</h2>
        </div>
        <div className="space-y-3">
          <div className="p-4 bg-orange-50 border-r-4 border-orange-500 rounded">
            <p className="font-semibold text-gray-900">5 طلبات تحتاج للتجهيز</p>
            <p className="text-sm text-gray-600 mt-1">قم بتجهيز الطلبات لشحنها في أقرب وقت</p>
          </div>
          <div className="p-4 bg-blue-50 border-r-4 border-blue-500 rounded">
            <p className="font-semibold text-gray-900">3 منتجات منخفضة المخزون</p>
            <p className="text-sm text-gray-600 mt-1">قم بتحديث المخزون لتجنب نفاد الكمية</p>
          </div>
          <div className="p-4 bg-purple-50 border-r-4 border-purple-500 rounded">
            <p className="font-semibold text-gray-900">2 تقييمات جديدة</p>
            <p className="text-sm text-gray-600 mt-1">قم بالرد على تقييمات العملاء</p>
          </div>
        </div>
      </div>
    </div>
  )
}

