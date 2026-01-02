'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 pt-20" dir="rtl">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <h1 className="text-4xl font-bold text-slate-800 mb-4">🔒 سياسة الخصوصية</h1>
            <p className="text-slate-600">آخر تحديث: ديسمبر 2025</p>
          </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          {/* مقدمة */}
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>🛡️</span> التزامنا بخصوصيتك
            </h2>
            <p className="text-slate-700 leading-relaxed">
              في بوابتي، نحن ملتزمون بحماية خصوصيتك وأمان بياناتك الشخصية. هذه السياسة توضح كيف نجمع 
              ونستخدم ونحمي معلوماتك عند استخدامك لمنصتنا.
            </p>
          </section>

          {/* المعلومات التي نجمعها */}
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>📊</span> المعلومات التي نجمعها
            </h2>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-l-4 border-blue-500">
                <h3 className="font-bold text-slate-800 mb-3 text-lg">1️⃣ معلومات الحساب</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <p className="text-slate-700">الاسم الكامل</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <p className="text-slate-700">عنوان البريد الإلكتروني</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <p className="text-slate-700">رقم الهاتف</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <p className="text-slate-700">كلمة المرور (مشفرة)</p>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-l-4 border-green-500">
                <h3 className="font-bold text-slate-800 mb-3 text-lg">2️⃣ معلومات التوصيل</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">•</span>
                    <p className="text-slate-700">عنوان التوصيل الكامل</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">•</span>
                    <p className="text-slate-700">الإحداثيات الجغرافية (للتوصيل الدقيق)</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">•</span>
                    <p className="text-slate-700">المدينة والرمز البريدي</p>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border-l-4 border-purple-500">
                <h3 className="font-bold text-slate-800 mb-3 text-lg">3️⃣ معلومات الدفع</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">•</span>
                    <p className="text-slate-700">معلومات البطاقة الائتمانية (مشفرة عبر بوابة دفع آمنة)</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">•</span>
                    <p className="text-slate-700">تاريخ المعاملات</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">•</span>
                    <p className="text-slate-700">معلومات الحساب البنكي (للبائعين والمناديب)</p>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border-l-4 border-orange-500">
                <h3 className="font-bold text-slate-800 mb-3 text-lg">4️⃣ معلومات الاستخدام</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600">•</span>
                    <p className="text-slate-700">سجل التصفح والمنتجات المشاهدة</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600">•</span>
                    <p className="text-slate-700">عنوان IP ونوع المتصفح والجهاز</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600">•</span>
                    <p className="text-slate-700">وقت ومدة الزيارات</p>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* كيف نستخدم المعلومات */}
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>⚙️</span> كيف نستخدم معلوماتك
            </h2>
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-xl">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-2xl">✓</span>
                  <p>معالجة وتوصيل طلباتك</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">✓</span>
                  <p>إدارة حسابك وتوفير الدعم الفني</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">✓</span>
                  <p>إرسال إشعارات حول طلباتك وتحديثات الخدمة</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">✓</span>
                  <p>تحسين تجربة المستخدم وتخصيص المحتوى</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">✓</span>
                  <p>منع الاحتيال وضمان أمان المنصة</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">✓</span>
                  <p>إرسال عروض تسويقية (يمكنك إلغاء الاشتراك في أي وقت)</p>
                </li>
              </ul>
            </div>
          </section>

          {/* مشاركة المعلومات */}
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>🤝</span> مشاركة المعلومات
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              نحن نحترم خصوصيتك ولا نبيع معلوماتك الشخصية لأطراف ثالثة. ومع ذلك، قد نشارك معلوماتك في الحالات التالية:
            </p>
            <div className="space-y-3">
              <div className="bg-yellow-50 p-4 rounded-xl border-r-4 border-yellow-500">
                <p className="font-bold text-slate-800 mb-2">🏪 مع البائعين</p>
                <p className="text-slate-700">نشارك معلومات الطلب والتوصيل مع البائع لإتمام العملية</p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl border-r-4 border-green-500">
                <p className="font-bold text-slate-800 mb-2">🚗 مع مناديب التوصيل</p>
                <p className="text-slate-700">نشارك عنوانك ورقم هاتفك مع المندوب المسؤول عن توصيل طلبك</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl border-r-4 border-blue-500">
                <p className="font-bold text-slate-800 mb-2">💳 مع معالجات الدفع</p>
                <p className="text-slate-700">نستخدم بوابات دفع آمنة ومعتمدة (PCI DSS compliant) لمعالجة المدفوعات</p>
              </div>
              <div className="bg-red-50 p-4 rounded-xl border-r-4 border-red-500">
                <p className="font-bold text-slate-800 mb-2">⚖️ الالتزامات القانونية</p>
                <p className="text-slate-700">قد نكشف عن معلوماتك إذا طُلب منا ذلك قانونياً أو لحماية حقوقنا</p>
              </div>
            </div>
          </section>

          {/* الأمان */}
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>🔐</span> أمان البيانات
            </h2>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
              <p className="text-slate-700 leading-relaxed mb-4">
                نستخدم أحدث تقنيات الأمان لحماية بياناتك:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 text-xl">🔒</span>
                  <p className="text-slate-700"><strong>تشفير SSL/TLS:</strong> جميع البيانات المرسلة عبر المنصة مشفرة</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 text-xl">🔒</span>
                  <p className="text-slate-700"><strong>تشفير كلمات المرور:</strong> نستخدم خوارزميات تشفير قوية (bcrypt)</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 text-xl">🔒</span>
                  <p className="text-slate-700"><strong>جدران حماية:</strong> أنظمة حماية متطورة ضد الهجمات الإلكترونية</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 text-xl">🔒</span>
                  <p className="text-slate-700"><strong>مراقبة 24/7:</strong> نراقب الأنظمة بشكل مستمر لاكتشاف أي نشاط مشبوه</p>
                </li>
              </ul>
            </div>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>🍪</span> ملفات تعريف الارتباط (Cookies)
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              نستخدم ملفات تعريف الارتباط لتحسين تجربتك على المنصة:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-xl">
                <p className="font-bold text-slate-800 mb-2">✅ ضرورية</p>
                <p className="text-sm text-slate-700">مطلوبة لعمل الموقع (مثل تسجيل الدخول والسلة)</p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl">
                <p className="font-bold text-slate-800 mb-2">📊 تحليلية</p>
                <p className="text-sm text-slate-700">تساعدنا على فهم كيفية استخدامك للموقع</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl">
                <p className="font-bold text-slate-800 mb-2">🎯 تسويقية</p>
                <p className="text-sm text-slate-700">لعرض إعلانات مخصصة (يمكنك رفضها)</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-xl">
                <p className="font-bold text-slate-800 mb-2">🔧 وظيفية</p>
                <p className="text-sm text-slate-700">لتذكر تفضيلاتك (اللغة، العملة، إلخ)</p>
              </div>
            </div>
          </section>

          {/* حقوقك */}
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>✊</span> حقوقك
            </h2>
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-6 rounded-xl">
              <p className="mb-4 font-bold">لديك الحق في:</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-2xl">📋</span>
                  <div>
                    <p className="font-bold">الوصول إلى بياناتك</p>
                    <p className="text-sm opacity-90">طلب نسخة من جميع المعلومات التي نحتفظ بها عنك</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">✏️</span>
                  <div>
                    <p className="font-bold">تصحيح بياناتك</p>
                    <p className="text-sm opacity-90">تحديث أو تصحيح أي معلومات غير دقيقة</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">🗑️</span>
                  <div>
                    <p className="font-bold">حذف حسابك</p>
                    <p className="text-sm opacity-90">طلب حذف جميع بياناتك الشخصية</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">⛔</span>
                  <div>
                    <p className="font-bold">الاعتراض على المعالجة</p>
                    <p className="text-sm opacity-90">رفض استخدام بياناتك لأغراض تسويقية</p>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          {/* الأطفال */}
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>👶</span> خصوصية الأطفال
            </h2>
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
              <p className="text-red-800 font-bold mb-3">⚠️ تنبيه مهم</p>
              <p className="text-slate-700 leading-relaxed">
                منصتنا غير موجهة للأطفال دون سن 18 عاماً. لا نجمع عن قصد معلومات شخصية من الأطفال. 
                إذا اكتشفنا أن طفلاً قد قدم معلومات شخصية، سنقوم بحذفها فوراً.
              </p>
            </div>
          </section>

          {/* التغييرات */}
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>🔄</span> التغييرات على السياسة
            </h2>
            <p className="text-slate-700 leading-relaxed">
              قد نقوم بتحديث هذه السياسة من وقت لآخر. سنخطرك بأي تغييرات جوهرية عبر:
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div className="bg-blue-50 p-4 rounded-xl text-center">
                <span className="text-3xl block mb-2">📧</span>
                <p className="font-bold text-slate-800">البريد الإلكتروني</p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl text-center">
                <span className="text-3xl block mb-2">🔔</span>
                <p className="font-bold text-slate-800">إشعار على الموقع</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl text-center">
                <span className="text-3xl block mb-2">📱</span>
                <p className="font-bold text-slate-800">رسالة نصية</p>
              </div>
            </div>
          </section>

          {/* التواصل */}
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>📞</span> تواصل معنا
            </h2>
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-xl">
              <p className="mb-4 text-lg font-bold">لأي استفسارات حول خصوصيتك أو هذه السياسة:</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="font-bold mb-2">📧 البريد الإلكتروني</p>
                  <p>privacy@bawabty.com</p>
                </div>
                <div>
                  <p className="font-bold mb-2">📞 الهاتف</p>
                  <p>+962 6 123 4567</p>
                </div>
                <div>
                  <p className="font-bold mb-2">📍 العنوان</p>
                  <p>الخليل، فلسطين</p>
                </div>
                <div>
                  <p className="font-bold mb-2">⏰ أوقات العمل</p>
                  <p>9:00 صباحاً - 6:00 مساءً</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-6 text-center space-x-4 space-x-reverse pb-8">
          <Link href="/terms" className="text-purple-600 hover:text-purple-700 font-bold">
            الشروط والأحكام
          </Link>
          <span className="text-slate-400">•</span>
          <Link href="/return-policy" className="text-purple-600 hover:text-purple-700 font-bold">
            سياسة الإرجاع
          </Link>
          <span className="text-slate-400">•</span>
          <Link href="/" className="text-purple-600 hover:text-purple-700 font-bold">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
}

