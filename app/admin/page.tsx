'use client'

import { TrendingUp, Users, Package, ShoppingCart, DollarSign, AlertCircle } from 'lucide-react'

export default function AdminDashboard() {
  // سيتم جلب البيانات من Supabase
  const stats: any[] = [];
  const pendingApprovals: any[] = [];
  const recentOrders: any[] = [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">لوحة تحكم المدير</h1>
        <p className="text-gray-600 mt-2">مرحباً بك! هنا نظرة عامة على منصتك</p>
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
        {/* Pending Approvals */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">الموافقات المعلقة</h2>
            <span className="bg-red-100 text-red-600 text-sm font-semibold px-3 py-1 rounded-full">
              {pendingApprovals.length} معلق
            </span>
          </div>
          <div className="space-y-4">
            {pendingApprovals.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">{item.type}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                    قبول
                  </button>
                  <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                    رفض
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">أحدث الطلبات</h2>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">{order.id}</p>
                  <p className="text-sm text-gray-600">{order.customer}</p>
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">{order.total}</p>
                  <p className="text-sm text-blue-600">{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sales Chart Placeholder */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">إحصائيات المبيعات</h2>
          <select className="px-4 py-2 border border-gray-300 rounded-lg">
            <option>آخر 7 أيام</option>
            <option>آخر 30 يوم</option>
            <option>آخر 3 أشهر</option>
          </select>
        </div>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">سيتم إضافة الرسم البياني هنا</p>
          </div>
        </div>
      </div>
    </div>
  )
}

