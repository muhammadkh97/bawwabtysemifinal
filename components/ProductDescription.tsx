'use client';

import { useState } from 'react';
import { Info, PackageCheck, Sparkles, Shield, Award, Truck } from 'lucide-react';

interface ProductDescriptionProps {
  description: string;
  productName: string;
}

export default function ProductDescription({ description, productName }: ProductDescriptionProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'shipping' | 'warranty'>('overview');

  // تقسيم الوصف إلى فقرات
  const paragraphs = description.split('\n').filter(p => p.trim());

  const tabs = [
    {
      id: 'overview' as const,
      label: 'نظرة عامة',
      icon: Info,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      id: 'features' as const,
      label: 'المميزات',
      icon: Sparkles,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'shipping' as const,
      label: 'الشحن',
      icon: Truck,
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      id: 'warranty' as const,
      label: 'الضمان',
      icon: Shield,
      gradient: 'from-orange-500 to-red-500',
    },
  ];

  const features = [
    { icon: '✨', title: 'جودة عالية', desc: 'منتج أصلي ومعتمد' },
    { icon: '🎯', title: 'أداء ممتاز', desc: 'تصميم عصري وعملي' },
    { icon: '🛡️', title: 'ضمان الشركة', desc: 'ضمان لمدة سنة كاملة' },
    { icon: '⚡', title: 'سهل الاستخدام', desc: 'واجهة بسيطة ومريحة' },
  ];

  const shippingInfo = [
    { icon: '📦', title: 'شحن مجاني', desc: 'للطلبات فوق 200 ريال' },
    { icon: '🚀', title: 'توصيل سريع', desc: 'من 1-3 أيام عمل' },
    { icon: '🌍', title: 'تغطية شاملة', desc: 'التوصيل لجميع المدن' },
    { icon: '📍', title: 'تتبع الشحنة', desc: 'تتبع مباشر للطلب' },
  ];

  const warrantyInfo = [
    { icon: '🛡️', title: 'ضمان سنة', desc: 'ضمان الشركة المصنعة' },
    { icon: '🔄', title: 'إرجاع مجاني', desc: 'خلال 14 يوم من الاستلام' },
    { icon: '🎁', title: 'استبدال فوري', desc: 'في حالة وجود عيب صناعي' },
    { icon: '✅', title: 'دعم فني', desc: 'خدمة عملاء على مدار الساعة' },
  ];

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 mb-8">
      {/* Tabs */}
      <div className="flex overflow-x-auto bg-gradient-to-r from-gray-50 to-purple-50 border-b border-gray-200 scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[120px] px-6 py-4 font-bold text-sm transition-all duration-300 relative ${
                activeTab === tab.id
                  ? 'text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </div>
              
              {activeTab === tab.id && (
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${tab.gradient} rounded-t-full`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Info className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900">وصف المنتج</h3>
                <p className="text-sm text-gray-500">تفاصيل شاملة عن {productName}</p>
              </div>
            </div>

            <div className="prose prose-lg max-w-none">
              {paragraphs.map((paragraph, index) => (
                <p key={index} className="text-gray-700 leading-relaxed mb-4">
                  {paragraph}
                </p>
              ))}
            </div>

            {paragraphs.length === 0 && (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                  <PackageCheck className="w-10 h-10 text-purple-600" />
                </div>
                <p className="text-gray-500">لا يوجد وصف تفصيلي متاح حالياً</p>
              </div>
            )}

            {/* بطاقات معلومات إضافية */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-8 border-t border-gray-100">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">منتج أصلي</p>
                  <p className="text-sm text-gray-600">معتمد ومضمون 100%</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">جودة عالية</p>
                  <p className="text-sm text-gray-600">مواد خام ممتازة</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'features' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900">مميزات المنتج</h3>
                <p className="text-sm text-gray-500">كل ما يميز {productName}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-gray-900 mb-1">{feature.title}</h4>
                      <p className="text-sm text-gray-600">{feature.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900">معلومات الشحن</h3>
                <p className="text-sm text-gray-500">توصيل سريع وآمن</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {shippingInfo.map((info, index) => (
                <div
                  key={index}
                  className="group p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-green-50 border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl group-hover:scale-110 transition-transform">
                      {info.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-gray-900 mb-1">{info.title}</h4>
                      <p className="text-sm text-gray-600">{info.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white">
              <h4 className="font-bold text-xl mb-3 flex items-center gap-2">
                <Truck className="w-6 h-6" />
                سياسة الشحن
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  الشحن مجاني للطلبات فوق 200 ريال
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  توصيل سريع من 1-3 أيام عمل
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  تتبع مباشر للشحنة عبر التطبيق
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'warranty' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900">الضمان والإرجاع</h3>
                <p className="text-sm text-gray-500">حماية كاملة لمشترياتك</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {warrantyInfo.map((info, index) => (
                <div
                  key={index}
                  className="group p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-orange-50 border border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl group-hover:scale-110 transition-transform">
                      {info.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-gray-900 mb-1">{info.title}</h4>
                      <p className="text-sm text-gray-600">{info.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white">
              <h4 className="font-bold text-xl mb-3 flex items-center gap-2">
                <Shield className="w-6 h-6" />
                سياسة الإرجاع والاستبدال
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  إرجاع مجاني خلال 14 يوم من تاريخ الاستلام
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  استبدال فوري في حالة وجود عيب صناعي
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  ضمان الشركة المصنعة لمدة سنة كاملة
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  دعم فني متاح على مدار الساعة
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
