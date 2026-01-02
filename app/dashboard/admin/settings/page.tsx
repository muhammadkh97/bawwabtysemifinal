'use client';

import { useState } from 'react';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50">
      <FuturisticSidebar role="admin" />
      
      {/* Main Content Area */}
      <div className="md:mr-[280px] transition-all duration-300">
        <FuturisticNavbar userName="" userRole="admin" />
        
        <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10 relative z-10 max-w-[1800px] mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">إعدادات النظام</h1>
            <p className="text-gray-600">إدارة إعدادات المنصة والتكوينات</p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
            <div className="flex gap-1 p-1 overflow-x-auto">
              {[
                { id: 'general', label: '⚙️ عام', },
                { id: 'payment', label: '💳 الدفع' },
                { id: 'shipping', label: '🚚 الشحن' },
                { id: 'notifications', label: '🔔 الإشعارات' },
                { id: 'security', label: '🔒 الأمان' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Settings Content */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اسم المنصة</label>
                  <input
                    type="text"
                    defaultValue="بوابتي"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">وصف المنصة</label>
                  <textarea
                    rows={3}
                    defaultValue="منصة تجارة إلكترونية شاملة"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني للدعم</label>
                  <input
                    type="email"
                    defaultValue="support@bawwabty.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                  <input
                    type="tel"
                    defaultValue="+970-XXX-XXXX"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {activeTab === 'payment' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">العملة الافتراضية</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="ILS">شيكل فلسطيني (₪)</option>
                    <option value="USD">دولار ($)</option>
                    <option value="EUR">يورو (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">معدل العمولة الافتراضي (%)</label>
                  <input
                    type="number"
                    defaultValue="10"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="paypal" className="w-5 h-5" defaultChecked />
                  <label htmlFor="paypal" className="text-gray-700">تفعيل PayPal</label>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="stripe" className="w-5 h-5" defaultChecked />
                  <label htmlFor="stripe" className="text-gray-700">تفعيل Stripe</label>
                </div>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تكلفة الشحن الافتراضية</label>
                  <input
                    type="number"
                    defaultValue="20"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الحد الأدنى للشحن المجاني</label>
                  <input
                    type="number"
                    defaultValue="200"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">مدة التوصيل المتوقعة (أيام)</label>
                  <input
                    type="number"
                    defaultValue="3-5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">إشعارات الطلبات الجديدة</p>
                    <p className="text-sm text-gray-600">إرسال إشعار عند استلام طلب جديد</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5" defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">إشعارات التسجيل</p>
                    <p className="text-sm text-gray-600">إرسال إشعار عند تسجيل مستخدم جديد</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5" defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">إشعارات المدفوعات</p>
                    <p className="text-sm text-gray-600">إرسال إشعار عند اكتمال الدفع</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5" defaultChecked />
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="2fa" className="w-5 h-5" />
                  <label htmlFor="2fa" className="text-gray-700">تفعيل المصادقة الثنائية</label>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="ip-block" className="w-5 h-5" />
                  <label htmlFor="ip-block" className="text-gray-700">حظر IP تلقائياً بعد محاولات فاشلة</label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">مدة الجلسة (دقيقة)</label>
                  <input
                    type="number"
                    defaultValue="60"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
              <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                إلغاء
              </button>
              <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                💾 حفظ التغييرات
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

