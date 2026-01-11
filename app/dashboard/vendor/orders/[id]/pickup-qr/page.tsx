'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { logger } from '@/lib/logger'
import { supabase } from '@/lib/supabase'
import { generatePickupCodes } from '@/lib/qrOtpUtils'
import QRCodeDisplay from '@/components/QRCodeDisplay'
import { 
  Package, 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Order {
  id: string
  order_number: string
  status: string
  total: number
  pickup_otp: string | null
  pickup_qr_code: string | null
  pickup_otp_expires_at: string | null
  picked_up_at: string | null
  driver: {
    full_name: string
    phone: string
  } | null
  delivery_address: any
  items: any[]
}

export default function VendorPickupQRPage() {
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
          if (payload.new.status === 'picked_up') {
            toast.success('✅ تم استلام الطلب من قبل المندوب!')
            setTimeout(() => {
              router.push('/dashboard/vendor/orders')
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

      // جلب تفاصيل الطلب
      const { data: orderData, error } = await supabase
        .from('orders')
        .select(`
          *,
          driver:users!orders_driver_id_fkey(full_name, phone),
          items:order_items(
            id,
            quantity,
            price,
            product:products(name, name_en, images)
          )
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error

      setOrder(orderData)

      // توليد أو جلب أكواد الاستلام
      let codes
      if (
        !orderData.pickup_otp ||
        !orderData.pickup_qr_code ||
        new Date(orderData.pickup_otp_expires_at) < new Date()
      ) {
        // توليد أكواد جديدة
        codes = await generatePickupCodes(params.id as string)
      } else {
        // استخدام الأكواد الموجودة
        codes = {
          qrCode: orderData.pickup_qr_code,
          otp: orderData.pickup_otp,
          expiresAt: new Date(orderData.pickup_otp_expires_at),
        }
      }

      setQrData(codes)
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching order and generating QR', { error: errorMessage, component: 'VendorPickupQRPage' });
      toast.error(error.message || 'فشل تحميل بيانات الطلب')
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerateCode = async () => {
    try {
      setRegenerating(true)
      const codes = await generatePickupCodes(params.id as string)
      setQrData(codes)
      toast.success('✅ تم إنشاء رمز جديد')
    } catch (error: any) {
      toast.error(error.message || 'فشل إنشاء الرمز')
    } finally {
      setRegenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">جاري تحميل رمز الاستلام...</p>
        </div>
      </div>
    )
  }

  if (!order || !qrData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">خطأ</h2>
          <p className="text-gray-600 mb-6">لم يتم العثور على الطلب</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition"
          >
            العودة
          </button>
        </div>
      </div>
    )
  }

  const isExpired = new Date(qrData.expiresAt) < new Date()
  const isPickedUp = order.status === 'picked_up'

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">العودة للطلبات</span>
        </button>

        {/* Success Banner (if picked up) */}
        {isPickedUp && (
          <div className="bg-green-500 text-white rounded-2xl p-6 mb-6 shadow-xl">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8" />
              <div>
                <h3 className="text-xl font-bold">تم الاستلام بنجاح!</h3>
                <p className="text-green-100">
                  تم استلام الطلب من قبل المندوب في{' '}
                  {new Date(order.picked_up_at!).toLocaleString('ar-SA')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Order Info Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <span>رمز استلام الطلب</span>
          </h1>

          <div className="space-y-4">
            {/* Order Number */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <span className="text-gray-600 font-medium">رقم الطلب:</span>
              <span className="font-bold text-lg text-gray-900">
                #{order.order_number}
              </span>
            </div>

            {/* Status */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
              <Clock className="w-5 h-5 text-green-600" />
              <span className="text-gray-600 font-medium">الحالة:</span>
              <span
                className={`px-4 py-2 rounded-full text-sm font-bold ${
                  isPickedUp
                    ? 'bg-green-100 text-green-800'
                    : order.status === 'ready'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {isPickedUp
                  ? 'تم الاستلام'
                  : order.status === 'ready'
                  ? 'جاهز للاستلام'
                  : 'قيد التحضير'}
              </span>
            </div>

            {/* Driver Info */}
            {order.driver ? (
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-3 mb-3">
                  <User className="w-5 h-5 text-green-600" />
                  <span className="font-bold text-gray-900">مندوب التوصيل:</span>
                </div>
                <div className="grid gap-2 mr-8">
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-medium">{order.driver.full_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span className="font-mono">{order.driver.phone}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200 text-center">
                <AlertCircle className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                <p className="text-yellow-800 font-medium">لم يتم تعيين مندوب بعد</p>
              </div>
            )}

            {/* Items Count & Total */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-purple-50 rounded-xl text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {order.items?.length || 0}
                </div>
                <div className="text-sm text-purple-800 font-medium">منتجات</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {order.total.toFixed(2)}
                </div>
                <div className="text-sm text-blue-800 font-medium">دينار</div>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Display */}
        {!isPickedUp && (
          <>
            <QRCodeDisplay
              qrData={qrData.qrCode}
              otp={qrData.otp}
              expiresAt={qrData.expiresAt}
              type="pickup"
              orderId={order.order_number}
            />

            {/* Regenerate Button */}
            <button
              onClick={handleRegenerateCode}
              disabled={regenerating}
              className="w-full mt-6 flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
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
              <span>اعرض هذا الرمز للمندوب عند وصوله لاستلام الطلب</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </span>
              <span>سيقوم المندوب بمسح رمز QR أو إدخال رمز OTP</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </span>
              <span>بعد التحقق، سيتم تحديث حالة الطلب تلقائياً إلى "تم الاستلام"</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                4
              </span>
              <span>احتفظ بالرمز حتى استلام المندوب الكامل للطلب</span>
            </li>
          </ol>
        </div>

        {/* Expiry Warning */}
        {isExpired && !isPickedUp && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div>
              <p className="font-bold text-red-900">انتهت صلاحية الرمز</p>
              <p className="text-sm text-red-700">
                الرجاء إنشاء رمز جديد باستخدام الزر أعلاه
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
