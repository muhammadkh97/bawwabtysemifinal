'use client'

import Link from 'next/link'
import { MapPin, Phone, Mail, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !email.includes('@')) {
      setError('الرجاء إدخال بريد إلكتروني صحيح')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      // التحقق من وجود البريد مسبقاً
      const { data: existing } = await supabase
        .from('newsletter_subscribers')
        .select('email')
        .eq('email', email)
        .single()

      if (existing) {
        setError('هذا البريد مشترك بالفعل')
        setLoading(false)
        return
      }

      // إضافة البريد إلى القائمة
      const { error: insertError } = await supabase
        .from('newsletter_subscribers')
        .insert({
          email: email,
          subscribed_at: new Date().toISOString(),
          is_active: true
        })

      if (insertError) throw insertError

      setSuccess(true)
      setEmail('')
      
      // إخفاء رسالة النجاح بعد 5 ثواني
      setTimeout(() => setSuccess(false), 5000)
    } catch (err: unknown) {
      console.error('خطأ في الاشتراك:', err)
      setError('حدث خطأ. حاول مرة أخرى')
    } finally {
      setLoading(false)
    }
  }

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <span className="text-2xl md:text-3xl">🛍️</span>
              <h3 className="text-xl md:text-2xl font-bold">بوابتي</h3>
            </div>
            <p className="text-gray-400 mb-2 md:mb-4 text-sm md:text-base">
              متجرك المميز
            </p>
            <p className="text-gray-400 text-xs md:text-sm">
              متجرك الإلكتروني الموثوق لشراء جميع احتياجاتك بأفضل الأسعار وأعلى جودة. نفخر
              بخدمة عملائنا الكرام.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-base md:text-lg font-bold mb-3 md:mb-4 flex items-center gap-2">
              ⚡ روابط سريعة
            </h4>
            <ul className="space-y-1.5 md:space-y-2 text-sm md:text-base">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition">
                  → من نحن
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-400 hover:text-white transition">
                  → المنتجات
                </Link>
              </li>
              <li>
                <Link href="/vendors" className="text-gray-400 hover:text-white transition">
                  → البائعون
                </Link>
              </li>
              <li>
                <Link href="/deals" className="text-gray-400 hover:text-white transition">
                  → العروض الخاصة
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition">
                  → اتصل بنا
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-base md:text-lg font-bold mb-3 md:mb-4 flex items-center gap-2">
              🛡️ خدمة العملاء
            </h4>
            <ul className="space-y-1.5 md:space-y-2 text-sm md:text-base">
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition">
                  → اتصل بنا
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-white transition">
                  → الأسئلة الشائعة
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-gray-400 hover:text-white transition">
                  → الشحن والتوصيل
                </Link>
              </li>
              <li>
                <Link href="/return-policy" className="text-gray-400 hover:text-white transition">
                  → سياسة الإرجاع
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-gray-400 hover:text-white transition">
                  → سياسة الخصوصية
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition">
                  → الشروط والأحكام
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-base md:text-lg font-bold mb-3 md:mb-4 flex items-center gap-2">
              📞 تواصل معنا
            </h4>
            <ul className="space-y-2 md:space-y-3">
              <li className="flex items-start gap-2 md:gap-3">
                <MapPin className="w-4 h-4 md:w-5 md:h-5 text-primary-400 flex-shrink-0 mt-1" />
                <span className="text-gray-400 text-xs md:text-sm">الخليل، فلسطين<br/>العروب</span>
              </li>
              <li className="flex items-center gap-2 md:gap-3">
                <Phone className="w-4 h-4 md:w-5 md:h-5 text-primary-400 flex-shrink-0" />
                <span className="text-gray-400 text-xs md:text-sm">+970-XXX-XXXX</span>
              </li>
              <li className="flex items-center gap-2 md:gap-3">
                <Mail className="w-4 h-4 md:w-5 md:h-5 text-primary-400 flex-shrink-0" />
                <span className="text-gray-400 text-xs md:text-sm">support@bawwabty.com</span>
              </li>
            </ul>

            <div className="mt-4 md:mt-6">
              <h5 className="font-bold mb-2 md:mb-3 text-xs md:text-sm">📧 اشترك في النشرة</h5>
              
              {success && (
                <div className="mb-2 flex items-center gap-2 text-green-400 text-xs">
                  <CheckCircle className="w-4 h-4" />
                  <span>تم الاشتراك بنجاح!</span>
                </div>
              )}
              
              {error && (
                <div className="mb-2 text-red-400 text-xs">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="بريدك الإلكتروني"
                  required
                  disabled={loading}
                  className="flex-1 px-2 md:px-3 py-1.5 md:py-2 bg-gray-800 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                />
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-3 md:px-4 py-1.5 md:py-2 bg-primary-600 rounded-lg hover:bg-primary-700 transition text-xs md:text-sm font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'جاري...' : 'اشترك'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
            <p className="text-gray-400 text-xs md:text-sm text-center">
              © 2025 بوابتي. جميع الحقوق محفوظة. صنع بـ ❤️ في فلسطين 🇵🇸
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-400">
              <span className="hidden sm:inline">طرق الدفع الآمنة:</span>
              <div className="flex gap-2 md:gap-3 flex-wrap justify-center">
                <span className="text-xs">💳 Visa</span>
                <span className="text-xs">💳 Mastercard</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

