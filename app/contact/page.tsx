'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Mail, Phone, MapPin, Send, CheckCircle, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/lib/logger'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    category: 'general'
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      // التحقق من تسجيل الدخول
      const { user } = await getCurrentUser()

      // إنشاء تذكرة دعم جديدة
      const { error: insertError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user?.id || null,
          user_name: formData.name,
          user_email: formData.email,
          user_phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
          category: formData.category,
          priority: 'medium',
          status: 'open'
        })

      if (insertError) throw insertError

      setSuccess(true)
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        category: 'general'
      })

      // إخفاء رسالة النجاح بعد 5 ثواني
      setTimeout(() => setSuccess(false), 5000)
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف';
      logger.error('خطأ في إرسال التذكرة', { error: errorMessage, component: 'ContactPage' });
      setError('حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-12">اتصل بنا</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6">أرسل لنا رسالة</h2>
            
            {/* رسالة النجاح */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-green-700 font-medium">تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.</p>
              </div>
            )}

            {/* رسالة الخطأ */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium mb-2">الاسم *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="أدخل اسمك"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">البريد الإلكتروني *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="example@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">رقم الهاتف</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="+970-XXX-XXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">التصنيف *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="general">استفسار عام</option>
                  <option value="order">استفسار عن طلب</option>
                  <option value="product">استفسار عن منتج</option>
                  <option value="technical">مشكلة تقنية</option>
                  <option value="complaint">شكوى</option>
                  <option value="suggestion">اقتراح</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">الموضوع *</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="موضوع الرسالة"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">الرسالة *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="اكتب رسالتك هنا..."
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري الإرسال...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>إرسال الرسالة</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold mb-6">معلومات التواصل</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">العنوان</h3>
                    <p className="text-gray-600">الخليل، فلسطين</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">الهاتف</h3>
                    <p className="text-gray-600">+970-XXX-XXXX</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">البريد الإلكتروني</h3>
                    <p className="text-gray-600">support@bawwabty.com</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-8 shadow-lg text-white">
              <h3 className="text-2xl font-bold mb-4">ساعات العمل</h3>
              <div className="space-y-2">
                <p className="flex justify-between">
                  <span>الأحد - الخميس:</span>
                  <span className="font-bold">9:00 ص - 6:00 م</span>
                </p>
                <p className="flex justify-between">
                  <span>الجمعة:</span>
                  <span className="font-bold">مغلق</span>
                </p>
                <p className="flex justify-between">
                  <span>السبت:</span>
                  <span className="font-bold">10:00 ص - 4:00 م</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}

