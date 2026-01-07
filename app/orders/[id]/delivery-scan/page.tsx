'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { verifyDeliveryWithQR, verifyDeliveryWithOTP } from '@/lib/qrOtpUtils'
import QRScanner from '@/components/QRScanner'
import {
  Package,
  Camera,
  Keyboard,
  ArrowLeft,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  Star,
  MessageSquare
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Order {
  id: string
  order_number: string
  status: string
  total: number
  driver: {
    full_name: string
    phone: string
  } | null
  vendor: {
    name: string
  }
  items: any[]
}

export default function CustomerDeliveryScanPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualOTP, setManualOTP] = useState('')
  const [customerId, setCustomerId] = useState<string | null>(null)

  useEffect(() => {
    fetchOrderAndCustomer()
  }, [params.id])

  const fetchOrderAndCustomer = async () => {
    try {
      setLoading(true)

      // الحصول على معرف العميل الحالي
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('يرجى تسجيل الدخول')
      }
      setCustomerId(user.id)

      // جلب تفاصيل الطلب
      const { data: orderData, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          driver:users!orders_driver_id_fkey(full_name, phone),
          vendor:vendors!orders_vendor_id_fkey(name),
          items:order_items(
            id,
            quantity,
            price,
            product:products(name, name_en, images)
          )
        `
        )
        .eq('id', params.id)
        .single()

      if (error) throw error

      // التحقق من أن العميل هو صاحب الطلب
      if (orderData.customer_id !== user.id) {
        toast.error('هذا الطلب لعميل آخر')
        router.push('/orders')
        return
      }

      // التحقق من الحالة
      if (orderData.status === 'delivered') {
        toast.info('تم تسليم هذا الطلب مسبقاً')
        router.push(`/orders/${params.id}`)
        return
      }

      if (!['in_transit', 'picked_up'].includes(orderData.status)) {
        toast.error('حالة الطلب غير مناسبة للتسليم')
        router.push('/orders')
        return
      }

      setOrder(orderData)
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'فشل تحميل بيانات الطلب')
    } finally {
      setLoading(false)
    }
  }

  const handleQRScan = async (qrData: string) => {
    if (!customerId) return

    try {
      setVerifying(true)
      setShowScanner(false)

      const result = await verifyDeliveryWithQR(qrData, customerId)

      if (result.success) {
        toast.success('✅ تم تأكيد التسليم بنجاح!')

        // الانتقال لصفحة التقييم
        setTimeout(() => {
          router.push(`/orders/${params.id}?review=true`)
        }, 1500)
      } else {
        toast.error(result.message || 'فشل التحقق من الرمز')
      }
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'حدث خطأ أثناء التحقق')
    } finally {
      setVerifying(false)
    }
  }

  const handleManualOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId || !manualOTP) return

    if (manualOTP.length !== 6 || !/^\d{6}$/.test(manualOTP)) {
      toast.error('رمز OTP يجب أن يكون 6 أرقام')
      return
    }

    try {
      setVerifying(true)

      const result = await verifyDeliveryWithOTP(
        params.id as string,
        manualOTP,
        customerId
      )

      if (result.success) {
        toast.success('✅ تم تأكيد التسليم بنجاح!')

        setTimeout(() => {
          router.push(`/orders/${params.id}?review=true`)
        }, 1500)
      } else {
        toast.error(result.message || 'رمز OTP غير صحيح')
      }
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'حدث خطأ أثناء التحقق')
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">خطأ</h2>
          <p className="text-gray-600">لم يتم العثور على الطلب</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScan={handleQRScan}
          onError={(error) => {
            toast.error(error)
            setShowScanner(false)
          }}
          expectedType="delivery"
          showManualInput={false}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">العودة</span>
          </button>

          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 mb-6 text-white shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Package className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">تأكيد استلام الطلب</h1>
                <p className="text-green-100">رقم الطلب: #{order.order_number}</p>
              </div>
            </div>
          </div>

          {/* Driver Info */}
          {order.driver && (
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <h2 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-green-600" />
                <span>معلومات مندوب التوصيل</span>
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <User className="w-5 h-5 text-green-600" />
                  <span className="font-bold text-gray-900">
                    {order.driver.full_name}
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <a
                    href={`tel:${order.driver.phone}`}
                    className="font-mono text-blue-600 hover:underline"
                  >
                    {order.driver.phone}
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="font-bold text-lg text-gray-900 mb-4">ملخص الطلب</h2>
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-600">المتجر:</span>
                <span className="font-bold text-gray-900">{order.vendor.name}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-purple-50 rounded-xl text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {order.items?.length || 0}
                </div>
                <div className="text-sm text-purple-800 font-medium">منتجات</div>
              </div>
              <div className="p-4 bg-green-50 rounded-xl text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {order.total.toFixed(2)}
                </div>
                <div className="text-sm text-green-800 font-medium">دينار</div>
              </div>
            </div>
          </div>

          {/* Verification Methods */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="font-bold text-lg text-gray-900 mb-4">
              طريقة تأكيد الاستلام
            </h2>

            {/* QR Scan Button */}
            <button
              onClick={() => setShowScanner(true)}
              disabled={verifying}
              className="w-full mb-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              <Camera className="w-6 h-6" />
              <span>مسح رمز QR من المندوب</span>
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">أو</span>
              </div>
            </div>

            {/* Manual OTP Input */}
            {!showManualInput ? (
              <button
                onClick={() => setShowManualInput(true)}
                disabled={verifying}
                className="w-full border-2 border-gray-300 text-gray-700 py-4 rounded-xl font-bold hover:border-green-500 hover:text-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <Keyboard className="w-6 h-6" />
                <span>إدخال رمز OTP يدوياً</span>
              </button>
            ) : (
              <form onSubmit={handleManualOTPSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    أدخل رمز OTP (6 أرقام)
                  </label>
                  <input
                    type="text"
                    value={manualOTP}
                    onChange={(e) =>
                      setManualOTP(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-4 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition font-mono tracking-widest"
                    disabled={verifying}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowManualInput(false)
                      setManualOTP('')
                    }}
                    className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={verifying || manualOTP.length !== 6}
                    className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {verifying ? 'جاري التحقق...' : 'تأكيد الاستلام'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6">
            <h3 className="font-bold text-green-900 mb-4">📝 التعليمات:</h3>
            <ol className="space-y-3 text-green-800">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </span>
                <span>تأكد من استلام جميع المنتجات من المندوب</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </span>
                <span>تحقق من سلامة المنتجات وصلاحيتها</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </span>
                <span>اطلب من المندوب عرض رمز QR أو OTP</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  4
                </span>
                <span>امسح الرمز أو أدخل OTP لتأكيد الاستلام</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  5
                </span>
                <span>بعد التأكيد، يمكنك تقييم الخدمة والمنتجات</span>
              </li>
            </ol>
          </div>

          {/* Review Prompt */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <Star className="w-6 h-6 text-yellow-500" />
              <h3 className="font-bold text-gray-900">قيّم تجربتك</h3>
            </div>
            <p className="text-gray-700 text-sm mb-4">
              بعد استلام الطلب، سيتم توجيهك لتقييم المنتجات وخدمة التوصيل لمساعدة
              الآخرين!
            </p>
            <div className="flex items-center gap-2 text-yellow-600">
              <MessageSquare className="w-5 h-5" />
              <span className="text-sm font-medium">
                رأيك يهمنا ويساعد في تحسين الخدمة
              </span>
            </div>
          </div>

          {/* Verifying Overlay */}
          {verifying && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center">
              <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
                <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  جاري التحقق...
                </h3>
                <p className="text-gray-600">الرجاء الانتظار</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
