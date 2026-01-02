'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Truck, Clock, MapPin, Package, CheckCircle, Phone } from 'lucide-react';

export default function ShippingPage() {
  const cities = [
    { name: 'عمّان', price: '2 دينار', time: '1-2 أيام' },
    { name: 'الزرقاء', price: '3 دينار', time: '1-2 أيام' },
    { name: 'إربد', price: '3 دينار', time: '2-3 أيام' },
    { name: 'العقبة', price: '5 دينار', time: '3-4 أيام' },
    { name: 'الكرك', price: '4 دينار', time: '2-3 أيام' },
    { name: 'مادبا', price: '3 دينار', time: '1-2 أيام' },
    { name: 'جرش', price: '3 دينار', time: '2-3 أيام' },
    { name: 'معان', price: '5 دينار', time: '3-4 أيام' },
  ];

  const steps = [
    { icon: Package, title: 'تأكيد الطلب', desc: 'سيتم تأكيد طلبك خلال ساعات' },
    { icon: Truck, title: 'التجهيز للشحن', desc: 'يتم تحضير طلبك للشحن' },
    { icon: MapPin, title: 'الشحن', desc: 'يتم شحن طلبك إلى عنوانك' },
    { icon: CheckCircle, title: 'التسليم', desc: 'استلم طلبك بكل راحة' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900" dir="rtl">
      <Header />
      
      <main className="container mx-auto px-4 py-12 mt-20">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mb-6">
            <Truck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            الشحن والتوصيل
          </h1>
          <p className="text-xl text-purple-200 max-w-2xl mx-auto">
            نوفر خدمة توصيل سريعة وآمنة لجميع أنحاء المملكة
          </p>
        </div>

        {/* Delivery Steps */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            مراحل التوصيل
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center mb-3 text-sm font-bold">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-purple-200">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cities and Prices */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            تكلفة ووقت التوصيل حسب المدينة
          </h2>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cities.map((city, index) => (
                <div
                  key={index}
                  className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-purple-400" />
                      <span className="text-white font-semibold">{city.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-purple-300 font-bold">{city.price}</div>
                      <div className="text-purple-200 text-sm flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {city.time}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-purple-500/20 rounded-xl border border-purple-400/30">
              <p className="text-purple-200 text-center">
                <strong className="text-white">شحن مجاني</strong> للطلبات التي تزيد عن 50 ديناراً
              </p>
            </div>
          </div>
        </div>

        {/* Tracking Information */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            تتبع الطلب
          </h2>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 max-w-3xl mx-auto">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    رقم التتبع
                  </h3>
                  <p className="text-purple-200 leading-relaxed">
                    بعد شحن طلبك، ستتلقى رقم تتبع عبر البريد الإلكتروني والرسائل النصية. يمكنك استخدام هذا الرقم لتتبع موقع طلبك في الوقت الفعلي.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    تحديثات فورية
                  </h3>
                  <p className="text-purple-200 leading-relaxed">
                    احصل على تحديثات فورية حول حالة طلبك عبر الإشعارات والرسائل. سنبقيك على اطلاع في كل خطوة من رحلة توصيل طلبك.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6 text-purple-400" />
              أوقات التسليم
            </h3>
            <ul className="space-y-3 text-purple-200">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span>التوصيل من الأحد إلى الخميس (9 صباحاً - 8 مساءً)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span>يوم الجمعة والسبت (10 صباحاً - 6 مساءً)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span>سيتم التواصل معك قبل التسليم</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Package className="w-6 h-6 text-purple-400" />
              شروط التوصيل
            </h3>
            <ul className="space-y-3 text-purple-200">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span>يجب تواجد شخص لاستلام الطلب</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span>يرجى فحص المنتجات عند الاستلام</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span>الدفع عند الاستلام متاح لجميع الطلبات</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

