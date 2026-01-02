'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('الكل');

  const faqs: FAQItem[] = [
    // حول التسجيل والحساب
    {
      category: 'الحساب',
      question: 'كيف أقوم بإنشاء حساب جديد؟',
      answer: 'يمكنك إنشاء حساب جديد من خلال النقر على زر "تسجيل" في أعلى الصفحة، ثم اختيار نوع الحساب (مشتري، بائع، مندوب)، وإدخال بياناتك الأساسية.'
    },
    {
      category: 'الحساب',
      question: 'هل يمكنني تغيير نوع الحساب بعد التسجيل؟',
      answer: 'نعم، يمكنك التواصل مع خدمة العملاء لتحويل حسابك من نوع لآخر، مع مراعاة تقديم المستندات المطلوبة حسب نوع الحساب الجديد.'
    },
    {
      category: 'الحساب',
      question: 'نسيت كلمة المرور، ماذا أفعل؟',
      answer: 'اضغط على "نسيت كلمة المرور" في صفحة تسجيل الدخول، أدخل بريدك الإلكتروني، وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.'
    },

    // حول التسوق
    {
      category: 'التسوق',
      question: 'كيف أقوم بالبحث عن منتج معين؟',
      answer: 'استخدم شريط البحث الذكي في أعلى الصفحة، يمكنك البحث بالاسم، الفئة، أو الكلمات المفتاحية. يوفر نظامنا اقتراحات فورية أثناء الكتابة.'
    },
    {
      category: 'التسوق',
      question: 'هل يمكنني حفظ المنتجات المفضلة؟',
      answer: 'نعم، اضغط على أيقونة القلب (❤️) على أي منتج لإضافته إلى قائمة المفضلة. يمكنك الوصول إليها في أي وقت من حسابك.'
    },
    {
      category: 'التسوق',
      question: 'كيف أضيف منتج إلى السلة؟',
      answer: 'اضغط على زر "أضف للسلة" على صفحة المنتج. يمكنك مراجعة سلتك في أي وقت من خلال أيقونة السلة في أعلى الصفحة.'
    },

    // حول الدفع
    {
      category: 'الدفع',
      question: 'ما هي طرق الدفع المتاحة؟',
      answer: 'نوفر عدة طرق للدفع: الدفع عند الاستلام، البطاقات الائتمانية (Visa, Mastercard), المحفظة الإلكترونية، والتحويل البنكي.'
    },
    {
      category: 'الدفع',
      question: 'هل بياناتي المالية آمنة؟',
      answer: 'نعم تماماً. نستخدم تقنيات التشفير المتقدمة (SSL 256-bit) لحماية جميع المعاملات المالية، ولا نخزن معلومات بطاقتك الائتمانية على خوادمنا.'
    },
    {
      category: 'الدفع',
      question: 'متى يتم خصم المبلغ من حسابي؟',
      answer: 'يتم خصم المبلغ فوراً عند تأكيد الطلب في حالة الدفع الإلكتروني. أما في حالة الدفع عند الاستلام، فيتم الدفع للمندوب مباشرة.'
    },

    // حول الشحن
    {
      category: 'الشحن',
      question: 'كم تستغرق مدة التوصيل؟',
      answer: 'عادة 1-3 أيام عمل داخل المدن الرئيسية (عمّان، إربد، الزرقاء)، و3-5 أيام للمناطق الأخرى. يمكنك تتبع طلبك لحظياً من خلال الموقع.'
    },
    {
      category: 'الشحن',
      question: 'كم تكلفة الشحن؟',
      answer: 'تبدأ من 2.50 دينار حسب المدينة. نوفر شحن مجاني للطلبات التي تزيد عن 50 ديناراً في بعض المناطق.'
    },
    {
      category: 'الشحن',
      question: 'هل يمكنني تغيير عنوان التوصيل بعد تقديم الطلب؟',
      answer: 'نعم، يمكنك التواصل مع خدمة العملاء أو المندوب مباشرة قبل خروج الطلب للتوصيل لتحديث العنوان.'
    },

    // حول الإرجاع والاستبدال
    {
      category: 'الإرجاع',
      question: 'ما هي سياسة الإرجاع؟',
      answer: 'يمكنك إرجاع أو استبدال المنتجات خلال 14 يوم من تاريخ الاستلام، بشرط أن يكون المنتج في حالته الأصلية مع جميع ملحقاته.'
    },
    {
      category: 'الإرجاع',
      question: 'كيف أطلب إرجاع أو استبدال؟',
      answer: 'اذهب إلى "طلباتي"، اختر الطلب المراد إرجاعه، اضغط على "طلب إرجاع"، واملأ النموذج. سيتواصل معك فريقنا خلال 24 ساعة.'
    },
    {
      category: 'الإرجاع',
      question: 'متى أستلم المبلغ المسترد؟',
      answer: 'بعد استلام المنتج المرتجع والتأكد من حالته، يتم رد المبلغ خلال 3-7 أيام عمل إلى نفس طريقة الدفع الأصلية.'
    },

    // للبائعين
    {
      category: 'للبائعين',
      question: 'كيف أصبح بائعاً على الموقع؟',
      answer: 'سجل حساب بائع، قدم المستندات المطلوبة (رخصة تجارية، هوية)، وانتظر الموافقة من فريق المراجعة (عادة 1-2 يوم عمل).'
    },
    {
      category: 'للبائعين',
      question: 'ما هي عمولة الموقع؟',
      answer: 'نأخذ عمولة تتراوح بين 5-15% حسب فئة المنتج وحجم مبيعاتك. كلما زادت مبيعاتك، قلت العمولة.'
    },
    {
      category: 'للبائعين',
      question: 'متى أستلم أرباحي؟',
      answer: 'يمكنك طلب سحب أرباحك من المحفظة في أي وقت. نقوم بمعالجة طلبات السحب خلال 3-5 أيام عمل.'
    },

    // للمناديب
    {
      category: 'للمناديب',
      question: 'كيف أنضم كمندوب توصيل؟',
      answer: 'سجل حساب مندوب، قدم رخصة القيادة، صورة المركبة، وبيانات التأمين. سيتواصل معك فريق التوظيف لإكمال الإجراءات.'
    },
    {
      category: 'للمناديب',
      question: 'كيف يتم حساب أجرتي؟',
      answer: 'تحصل على مبلغ ثابت لكل توصيلة (2-5 دينار حسب المسافة) + مكافآت إضافية على التقييمات العالية والتوصيلات السريعة.'
    },
    {
      category: 'للمناديب',
      question: 'هل يوجد دعم فني للمناديب؟',
      answer: 'نعم، فريق الدعم متاح 24/7 من خلال الشات المباشر في التطبيق لمساعدتك في أي مشكلة تقنية أو لوجستية.'
    },

    // تقني
    {
      category: 'تقني',
      question: 'هل يوجد تطبيق للهاتف؟',
      answer: 'نعم، متوفر على App Store و Google Play. حالياً الموقع متجاوب مع جميع الأجهزة ويعمل بكفاءة عالية.'
    },
    {
      category: 'تقني',
      question: 'كيف أفعّل الإشعارات؟',
      answer: 'اذهب إلى الإعدادات > الإشعارات، وفعّل الإشعارات التي تهمك (تحديثات الطلب، عروض خاصة، رسائل البائعين).'
    },
  ];

  const categories = ['الكل', ...Array.from(new Set(faqs.map(f => f.category)))];

  const filteredFAQs = activeCategory === 'الكل' 
    ? faqs 
    : faqs.filter(f => f.category === activeCategory);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-12" dir="rtl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
              الأسئلة الشائعة
            </h1>
            <p className="text-lg text-slate-600">
              إجابات لأكثر الأسئلة شيوعاً حول بوابتي
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-2.5 rounded-full font-medium transition-all ${
                  activeCategory === category
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {filteredFAQs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-md overflow-hidden transition-all hover:shadow-lg"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-right hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1">
                    <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full mb-2">
                      {faq.category}
                    </span>
                    <h3 className="text-lg font-semibold text-slate-800">
                      {faq.question}
                    </h3>
                  </div>
                  <ChevronDown
                    className={`w-6 h-6 text-slate-400 transition-transform flex-shrink-0 mr-4 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {openIndex === index && (
                  <div className="px-6 pb-5 text-slate-600 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="mt-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-3">لم تجد إجابة لسؤالك؟</h2>
            <p className="mb-6 text-purple-100">
              فريق خدمة العملاء جاهز لمساعدتك على مدار الساعة
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/contact"
                className="px-8 py-3 bg-white text-purple-600 rounded-full font-semibold hover:bg-purple-50 transition-colors"
              >
                اتصل بنا
              </a>
              <a
                href="/chats"
                className="px-8 py-3 bg-purple-700 text-white rounded-full font-semibold hover:bg-purple-800 transition-colors"
              >
                الدردشة المباشرة
              </a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

