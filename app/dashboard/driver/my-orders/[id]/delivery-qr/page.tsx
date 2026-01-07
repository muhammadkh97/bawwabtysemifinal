'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { generateDeliveryCodes } from '@/lib/qrOtpUtils'
import QRCodeDisplay from '@/components/QRCodeDisplay'
import {
  Package,
  User,
  MapPin,
  Phone,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Navigation
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Order {
  id: string
  order_number: string
  status: string
  total: number
  delivery_otp: string | null
  delivery_qr_code: string | null
  delivery_otp_expires_at: string | null
  delivered_at: string | null
  customer: {
    full_name: string
    phone: string
  }
  delivery_address: any
  items: any[]
}

export default function DriverDeliveryQRPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [qrData, setQrData] = useState<{
    qrCode: string
    otp: string
    expiresAt: Date
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    fetchOrderAndGenerateQR()

    // الاستماع للتحديثات في الوقت الفعلي
    const channel = supabase
      .channel(`order-${params.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${params.id}`,
        },
        (payload) => {
          console.log('Order updated:', payload)
          if (payload.new.status === 'delivered') {
            toast.success('✅ تم تأكيد التسليم من قبل العميل!')
            setTimeout(() => {
              router.push('/dashboard/driver/my-orders')
            }, 2000)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [params.id])

  const fetchOrderAndGenerateQR = async () => {
    try {
      setLoading(true)

      // الحصول على معرف السائق الحالي
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('يرجى تسجيل الدخول')

      // جلب تفاصيل الطلب
      const { data: orderData, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          customer:users!orders_customer_id_fkey(full_name, phone),
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

      // التحقق من أن السائق المعين هو الحالي
      if (orderData.driver_id !== user.id) {
        toast.error('هذا الطلب معين لسائق آخر')
        router.push('/dashboard/driver/my-orders')
        return
      }

      // التحقق من الحالة
      if (orderData.status === 'delivered') {
        toast.info('تم تسليم هذا الطلب مسبقاً')
        router.push(`/dashboard/driver/my-orders/${params.id}`)
        return
      }

      if (!['picked_up', 'in_transit'].includes(orderData.status)) {
        toast.error('يجب استلام الطلب من البائع أولاً')
        router.push(`/dashboard/driver/my-orders/${params.id}/pickup-scan`)
        return
      }

      setOrder(orderData)

      // توليد أو جلب أكواد التسليم
      let codes
      if (
        !orderData.delivery_otp ||
        !orderData.delivery_qr_code ||
        new Date(orderData.delivery_otp_expires_at) < new Date()
      ) {
        codes = await generateDeliveryCodes(params.id as string)
      } else {
        codes = {
          qrCode: orderData.delivery_qr_code,
          otp: orderData.delivery_otp,
          expiresAt: new Date(orderData.delivery_otp_expires_at),
        }
      }

      setQrData(codes)

      // تحديث الحالة إلى in_transit إن لم تكن كذلك
      if (orderData.status === 'picked_up') {
        await supabase
          .from('orders')
          .update({ status: 'in_transit', updated_at: new Date().toISOString() })
          .eq('id', params.id)
      }
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'فشل تحميل بيانات الطلب')
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerateCode = async () => {
    try {
      setRegenerating(true)
      const codes = await generateDeliveryCodes(params.id as string)
      setQrData(codes)
      toast.success('✅ تم إنشاء رمز جديد')
    } catch (error: any) {
      toast.error(error.message || 'فشل إنشاء الرمز')
    } finally {
      setRegenerating(false)
    }
  }

  const handleOpenMaps = () => {
    if (!order?.delivery_address) return

    const { lat, lng, latitude, longitude } = order.delivery_address
    const finalLat = lat || latitude
    const finalLng = lng || longitude

    if (finalLat && finalLng) {
      // فتح خرائط جوجل
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${finalLat},${finalLng}`,
        '_blank'
      )
    } else {
      toast.error('لا يوجد موقع محدد للعنوان')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">جاري تحميل رمز التسليم...</p>
        </div>
      </div>
    )
  }

  if (!order || !qrData) {
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

  const isDelivered = order.status === 'delivered'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">العودة</span>
        </button>

        {/* Success Banner (if delivered) */}
        {isDelivered && (
          <div className="bg-green-500 text-white rounded-2xl p-6 mb-6 shadow-xl">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8" />
              <div>
                <h3 className="text-xl font-bold">تم التسليم بنجاح!</h3>
                <p className="text-green-100">
                  تم تسليم الطلب للعميل في{' '}
                  {new Date(order.delivered_at!).toLocaleString('ar-SA')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-6 text-white shadow-xl">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">رمز تسليم الطلب</h1>
              <p className="text-blue-100">رقم الطلب: #{order.order_number}</p>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <span>معلومات العميل</span>
          </h2>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <User className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-gray-900">
                {order.customer.full_name}
              </span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Phone className="w-5 h-5 text-green-600" />
              <a
                href={`tel:${order.customer.phone}`}
                className="font-mono text-blue-600 hover:underline"
              >
                {order.customer.phone}
              </a>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3 mb-3">
                <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 mb-1">عنوان التسليم:</p>
                  <p className="text-sm text-gray-700">
                    {order.delivery_address?.formatted_address ||
                      order.delivery_address?.street ||
                      'لا يوجد عنوان'}
                  </p>
                  {order.delivery_address?.notes && (
                    <p className="text-sm text-gray-600 mt-2">
                      ملاحظات: {order.delivery_address.notes}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleOpenMaps}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
              >
                <Navigation className="w-5 h-5" />
                <span>فتح في خرائط جوجل</span>
              </button>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="font-bold text-lg text-gray-900 mb-4">ملخص الطلب</h2>
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

        {/* QR Code Display */}
        {!isDelivered && (
          <>
            <QRCodeDisplay
              qrData={qrData.qrCode}
              otp={qrData.otp}
              expiresAt={qrData.expiresAt}
              type="delivery"
              orderId={order.order_number}
            />

            {/* Regenerate Button */}
            <button
              onClick={handleRegenerateCode}
              disabled={regenerating}
              className="w-full mt-6 flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`w-5 h-5 ${regenerating ? 'animate-spin' : ''}`}
              />
              <span>{regenerating ? 'جاري الإنشاء...' : 'إنشاء رمز جديد'}</span>
            </button>
          </>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mt-6">
          <h3 className="font-bold text-blue-900 mb-4 text-lg">📝 التعليمات:</h3>
          <ol className="space-y-3 text-blue-800">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </span>
              <span>اذهب إلى عنوان العميل باستخدام خرائط جوجل</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </span>
              <span>اتصل بالعميل عند الوصول</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </span>
              <span>اعرض رمز QR أو OTP للعميل</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                4
              </span>
              <span>سيقوم العميل بمسح الرمز لتأكيد التسليم</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                5
              </span>
              <span>انتظر حتى يتم التأكيد من قبل العميل</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
