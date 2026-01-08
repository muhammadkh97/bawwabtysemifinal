import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Shield, Lock, CreditCard, CheckCircle, AlertTriangle, FileCheck } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'أمان الدفع - بوابتي',
  description: 'تعرف على إجراءات أمان الدفع في بوابتي - حماية كاملة لمعلوماتك المالية',
}

export default function PaymentSecurityPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-green-50">
      <Header />
      
      <div className="container mx-auto px-4 py-20">
        {/* العنوان الرئيسي */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 mb-6 shadow-2xl">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
            🛡️ أمان الدفع
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            نوفر لك أعلى معايير الأمان لحماية معلوماتك المالية
          </p>
        </div>

        {/* المميزات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-green-100 hover:border-green-300 transition-all">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900">تشفير SSL</h3>
            <p className="text-gray-600">حماية كاملة لجميع المعاملات</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-blue-100 hover:border-blue-300 transition-all">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900">طرق دفع آمنة</h3>
            <p className="text-gray-600">بوابات دفع موثوقة ومعتمدة</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-purple-100 hover:border-purple-300 transition-all">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
              <FileCheck className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-gray-900">شهادات معتمدة</h3>
            <p className="text-gray-600">PCI DSS وISO 27001</p>
          </div>
        </div>

        {/* إجراءات الأمان */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-16">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-white">
            <h2 className="text-3xl font-black mb-2">🔒 إجراءات الأمان</h2>
            <p className="text-green-100">نحمي معلوماتك بأحدث تقنيات الأمان</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2 text-gray-900">تشفير البيانات</h3>
                <p className="text-gray-600">
                  نستخدم تشفير SSL/TLS 256-bit لحماية جميع البيانات المنقولة بين جهازك وخوادمنا.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2 text-gray-900">بوابات دفع موثوقة</h3>
                <p className="text-gray-600">
                  نتعامل مع أفضل بوابات الدفع المعتمدة عالمياً مثل Stripe وPayPal وTapPayments.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2 text-gray-900">عدم حفظ البيانات الحساسة</h3>
                <p className="text-gray-600">
                  لا نقوم بتخزين معلومات بطاقتك الائتمانية على خوادمنا، كل المعاملات تتم عبر بوابات دفع خارجية آمنة.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2 text-gray-900">المصادقة الثنائية</h3>
                <p className="text-gray-600">
                  نوفر خيار المصادقة الثنائية (2FA) لحماية إضافية لحسابك.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2 text-gray-900">مراقبة مستمرة</h3>
                <p className="text-gray-600">
                  نراقب جميع المعاملات بشكل مستمر لاكتشاف أي نشاط مشبوه.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* طرق الدفع المتاحة */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 mb-16 border-2 border-green-200">
          <h2 className="text-3xl font-black mb-6 text-gray-900 flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-green-600" />
            طرق الدفع المتاحة
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
              <div className="text-4xl mb-2">💳</div>
              <p className="font-bold text-gray-900">بطاقات الائتمان</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
              <div className="text-4xl mb-2">💰</div>
              <p className="font-bold text-gray-900">الدفع عند الاستلام</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
              <div className="text-4xl mb-2">📱</div>
              <p className="font-bold text-gray-900">المحافظ الرقمية</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
              <div className="text-4xl mb-2">🏦</div>
              <p className="font-bold text-gray-900">التحويل البنكي</p>
            </div>
          </div>
        </div>

        {/* تحذير أمني */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-3xl p-8 text-white mb-16">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 flex-shrink-0" />
            <div>
              <h3 className="text-2xl font-black mb-3">⚠️ نصائح أمان مهمة</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  لا تشارك معلومات حسابك أو كلمة المرور مع أي شخص
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  تأكد من تسجيل الخروج من حسابك عند استخدام جهاز مشترك
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  راقب حسابك البنكي بانتظام وأبلغنا فوراً عن أي نشاط مشبوه
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  استخدم كلمة مرور قوية ومختلفة لحسابك
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* زر العودة */}
        <div className="text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-green-500/50 transition-all hover:scale-105"
          >
            <Shield className="w-6 h-6" />
            <span>تسوق بأمان الآن</span>
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  )
}
