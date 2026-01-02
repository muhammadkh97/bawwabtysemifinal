'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { RotateCcw, CheckCircle, XCircle, Clock, CreditCard, Package, AlertCircle } from 'lucide-react';

export default function ReturnPolicyPage() {
  const returnSteps = [
    {
      icon: Package,
      title: 'طلب الإرجاع',
      desc: 'تواصل معنا خلال 14 يوماً من الاستلام',
    },
    {
      icon: CheckCircle,
      title: 'الموافقة',
      desc: 'سنراجع طلبك ونوافق عليه',
    },
    {
      icon: RotateCcw,
      title: 'إرسال المنتج',
      desc: 'أرسل المنتج إلى عنواننا',
    },
    {
      icon: CreditCard,
      title: 'استرداد المبلغ',
      desc: 'استلم أموالك خلال 5-7 أيام عمل',
    },
  ];

  const acceptableConditions = [
    'المنتج في حالته الأصلية دون استخدام',
    'العبوة والتغليف الأصلي سليم',
    'جميع الملحقات والهدايا المجانية موجودة',
    'لم يمض أكثر من 14 يوماً على الاستلام',
    'الفاتورة الأصلية موجودة',
  ];

  const nonReturnableItems = [
    'المنتجات الغذائية والمشروبات',
    'منتجات العناية الشخصية المفتوحة',
    'الملابس الداخلية ومنتجات النظافة',
    'البرامج والتطبيقات الرقمية',
    'المنتجات المخصصة حسب الطلب',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900" dir="rtl">
      <Header />
      
      <main className="container mx-auto px-4 py-12 mt-20">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mb-6">
            <RotateCcw className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            سياسة الإرجاع والاسترداد
          </h1>
          <p className="text-xl text-purple-200 max-w-2xl mx-auto">
            نضمن لك تجربة تسوق آمنة مع إمكانية الإرجاع خلال 14 يوماً
          </p>
        </div>

        {/* Return Period Notice */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-md rounded-2xl p-8 border border-purple-400/30">
            <div className="flex items-start gap-4">
              <Clock className="w-8 h-8 text-purple-300 flex-shrink-0" />
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  فترة الإرجاع: 14 يوماً
                </h3>
                <p className="text-purple-100 leading-relaxed">
                  يمكنك إرجاع معظم المنتجات خلال 14 يوماً من تاريخ الاستلام. نحن نؤمن بحقك في تغيير رأيك وضمان رضاك الكامل عن مشترياتك.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Return Steps */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            خطوات الإرجاع
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {returnSteps.map((step, index) => (
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

        {/* Conditions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-12">
          {/* Acceptable Conditions */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">
                شروط الإرجاع المقبولة
              </h3>
            </div>
            <ul className="space-y-3">
              {acceptableConditions.map((condition, index) => (
                <li key={index} className="flex items-start gap-3 text-purple-200">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>{condition}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Non-Returnable Items */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-500 to-rose-500 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">
                منتجات غير قابلة للإرجاع
              </h3>
            </div>
            <ul className="space-y-3">
              {nonReturnableItems.map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-purple-200">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Refund Information */}
        <div className="max-w-5xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            معلومات الاسترداد
          </h2>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-purple-400" />
                  طرق الاسترداد
                </h3>
                <ul className="space-y-3 text-purple-200">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>إرجاع المبلغ إلى نفس طريقة الدفع</span>
              </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>رصيد في المحفظة الإلكترونية</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>تحويل بنكي (حسب الطلب)</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-purple-400" />
                  المدة الزمنية
                </h3>
                <ul className="space-y-3 text-purple-200">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>معالجة الطلب: 2-3 أيام عمل</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>استرداد البطاقة: 5-7 أيام عمل</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>رصيد المحفظة: فوري</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-md rounded-2xl p-8 border border-yellow-400/30">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-8 h-8 text-yellow-300 flex-shrink-0" />
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  ملاحظات هامة
                </h3>
                <ul className="space-y-3 text-purple-100">
                  <li className="flex items-start gap-2">
                    • <span>تكلفة الشحن للإرجاع يتحملها العميل ما لم يكن المنتج معيباً</span>
                  </li>
                  <li className="flex items-start gap-2">
                    • <span>في حالة المنتجات المعيبة، نتحمل كامل تكاليف الإرجاع والاستبدال</span>
                  </li>
                  <li className="flex items-start gap-2">
                    • <span>يمكنك طلب الاستبدال بدلاً من الإرجاع إذا كان المنتج متوفراً</span>
                  </li>
                  <li className="flex items-start gap-2">
                    • <span>للمزيد من المساعدة، تواصل مع خدمة العملاء على مدار الساعة</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="text-center mt-12">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              هل لديك استفسار؟
            </h3>
            <p className="text-purple-200 mb-6">
              فريق خدمة العملاء جاهز لمساعدتك في أي وقت
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                تواصل معنا
              </a>
              <a
                href="/faq"
                className="px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20"
              >
                الأسئلة الشائعة
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

