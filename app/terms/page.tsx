'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 pt-20" dir="rtl">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <h1 className="text-4xl font-bold text-slate-800 mb-4">📜 الشروط والأحكام</h1>
            <p className="text-slate-600">آخر تحديث: ديسمبر 2025</p>
          </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          {/* مقدمة */}
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>🎯</span> مقدمة
            </h2>
            <p className="text-slate-700 leading-relaxed">
              مرحباً بك في منصة بوابتي! هذه الشروط والأحكام تحكم استخدامك لموقعنا وخدماتنا. 
              باستخدامك للمنصة، فإنك توافق على الالتزام بهذه الشروط.
            </p>
          </section>

          {/* التعريفات */}
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>📖</span> التعريفات
            </h2>
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-l-4 border-blue-500">
                <p className="font-bold text-slate-800 mb-2">المنصة</p>
                <p className="text-slate-700">يشير إلى موقع بوابتي وجميع خدماته ومنتجاته</p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border-l-4 border-green-500">
                <p className="font-bold text-slate-800 mb-2">المستخدم</p>
                <p className="text-slate-700">أي شخص يستخدم المنصة سواء كان مشترياً أو بائعاً أو مندوب توصيل</p>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border-l-4 border-purple-500">
                <p className="font-bold text-slate-800 mb-2">البائع</p>
                <p className="text-slate-700">التاجر أو الشخص الذي يعرض منتجاته للبيع عبر المنصة</p>
              </div>
            </div>
          </section>

          {/* استخدام المنصة */}
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>✅</span> شروط الاستخدام
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-green-600 text-xl">✓</span>
                <p className="text-slate-700">يجب أن تكون بعمر 18 سنة على الأقل لاستخدام المنصة</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 text-xl">✓</span>
                <p className="text-slate-700">يجب تقديم معلومات صحيحة ودقيقة عند التسجيل</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 text-xl">✓</span>
                <p className="text-slate-700">أنت مسؤول عن الحفاظ على سرية كلمة المرور الخاصة بك</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 text-xl">✓</span>
                <p className="text-slate-700">يجب عدم استخدام المنصة لأي أغراض غير قانونية</p>
              </li>
            </ul>
          </section>

          {/* البائعون */}
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>🏪</span> شروط البائعين
            </h2>
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-6">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-orange-600 text-xl">•</span>
                  <p className="text-slate-700">يجب على البائع تقديم وثائق تثبت هويته ونشاطه التجاري</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-600 text-xl">•</span>
                  <p className="text-slate-700">جميع المنتجات تخضع للمراجعة والموافقة قبل النشر</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-600 text-xl">•</span>
                  <p className="text-slate-700">تُفرض عمولة 10% على كل عملية بيع ناجحة</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-600 text-xl">•</span>
                  <p className="text-slate-700">البائع مسؤول عن جودة المنتجات ومطابقتها للأوصاف</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-600 text-xl">•</span>
                  <p className="text-slate-700">الحد الأدنى للسحب من المحفظة هو 100 دينار</p>
                </li>
              </ul>
            </div>
          </section>

          {/* العمليات المالية */}
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>💰</span> الأسعار والمدفوعات
            </h2>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl">
                <p className="font-bold text-slate-800 mb-2">العمولة</p>
                <p className="text-slate-700">تحتفظ المنصة بعمولة 10% من قيمة كل طلب يتم إتمامه بنجاح</p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl">
                <p className="font-bold text-slate-800 mb-2">تحويل الأموال للبائعين</p>
                <p className="text-slate-700">يتم تحويل الأموال للبائعين خلال 1-3 أيام عمل من طلب السحب</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl">
                <p className="font-bold text-slate-800 mb-2">الضرائب</p>
                <p className="text-slate-700">تُضاف ضريبة المبيعات (16%) على جميع الطلبات وفقاً للقانون الأردني</p>
              </div>
            </div>
          </section>

          {/* الإرجاع والاسترجاع */}
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>↩️</span> سياسة الإرجاع والاسترجاع
            </h2>
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-yellow-600 text-xl">⚠️</span>
                  <p className="text-slate-700">يمكن إرجاع المنتج خلال 7 أيام من الاستلام</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow-600 text-xl">⚠️</span>
                  <p className="text-slate-700">يجب أن يكون المنتج في حالته الأصلية مع التغليف</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow-600 text-xl">⚠️</span>
                  <p className="text-slate-700">استرجاع الأموال يتم خلال 5-7 أيام عمل</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow-600 text-xl">⚠️</span>
                  <p className="text-slate-700">بعض المنتجات غير قابلة للإرجاع (ملابس داخلية، مستحضرات تجميل مفتوحة، إلخ)</p>
                </li>
              </ul>
            </div>
          </section>

          {/* حل النزاعات */}
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>⚖️</span> حل النزاعات
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              في حالة حدوث نزاع بين المشتري والبائع، تلتزم المنصة بالتحقيق في الموضوع واتخاذ القرار المناسب.
              يمكن للمشتري فتح نزاع خلال 14 يوماً من تاريخ الطلب.
            </p>
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <p className="text-red-800 font-bold">⚠️ تحذير</p>
              <p className="text-slate-700 mt-2">
                فتح نزاعات كاذبة أو محاولة الاحتيال قد يؤدي إلى إغلاق حسابك بشكل نهائي
              </p>
            </div>
          </section>

          {/* المسؤولية */}
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>📋</span> إخلاء المسؤولية
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-red-600 text-xl">✗</span>
                <p className="text-slate-700">المنصة غير مسؤولة عن جودة المنتجات المباعة من قبل البائعين</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-600 text-xl">✗</span>
                <p className="text-slate-700">نحن وسيط فقط بين البائع والمشتري</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-600 text-xl">✗</span>
                <p className="text-slate-700">المنصة غير مسؤولة عن تأخير التوصيل بسبب ظروف خارجة عن إرادتنا</p>
              </li>
            </ul>
          </section>

          {/* التعديلات */}
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>🔄</span> تعديل الشروط
            </h2>
            <p className="text-slate-700 leading-relaxed">
              نحتفظ بالحق في تعديل هذه الشروط والأحكام في أي وقت. سيتم إخطارك بأي تغييرات جوهرية عبر البريد الإلكتروني
              أو من خلال إشعار على المنصة. استمرارك في استخدام المنصة بعد التعديلات يعني موافقتك عليها.
            </p>
          </section>

          {/* التواصل */}
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>📧</span> تواصل معنا
            </h2>
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-xl">
              <p className="mb-3">إذا كان لديك أي استفسارات حول هذه الشروط والأحكام، يرجى التواصل معنا:</p>
              <div className="space-y-2">
                <p>📧 البريد الإلكتروني: support@bawabty.com</p>
                <p>📞 الهاتف: +970 XXX XXXX</p>
                <p>📍 العنوان: الخليل، فلسطين</p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-6 text-center space-x-4 space-x-reverse pb-8">
          <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-700 font-bold">
            سياسة الخصوصية
          </Link>
          <span className="text-slate-400">•</span>
          <Link href="/return-policy" className="text-blue-600 hover:text-blue-700 font-bold">
            سياسة الإرجاع
          </Link>
          <span className="text-slate-400">•</span>
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-bold">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
}

