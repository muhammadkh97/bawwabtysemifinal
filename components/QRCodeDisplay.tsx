'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode.react'
import { formatOTP, getOTPTimeRemaining, isOTPExpired } from '@/lib/qrOtpUtils'
import { Download, Copy, Clock, CheckCircle, AlertCircle } from 'lucide-react'

interface QRCodeDisplayProps {
  /** QR code data (JSON string) */
  qrData: string
  /** OTP code */
  otp: string
  /** OTP expiry date */
  expiresAt: Date
  /** Type of handoff */
  type: 'pickup' | 'delivery'
  /** Order ID for display */
  orderId: string
  /** Additional info to display */
  orderInfo?: {
    total?: number
    items?: number
    customerName?: string
    vendorName?: string
  }
}

export default function QRCodeDisplay({
  qrData,
  otp,
  expiresAt,
  type,
  orderId,
  orderInfo,
}: QRCodeDisplayProps) {
  const qrRef = useRef<HTMLDivElement>(null)
  const [timeRemaining, setTimeRemaining] = useState('')
  const [copied, setCopied] = useState(false)
  const [expired, setExpired] = useState(false)

  // Update countdown timer
  useEffect(() => {
    const updateTimer = () => {
      setTimeRemaining(getOTPTimeRemaining(expiresAt))
      setExpired(isOTPExpired(expiresAt))
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [expiresAt])

  // Copy OTP to clipboard
  const handleCopyOTP = async () => {
    try {
      await navigator.clipboard.writeText(otp)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // Download QR code as image
  const handleDownloadQR = () => {
    if (!qrRef.current) return

    const canvas = qrRef.current.querySelector('canvas')
    if (!canvas) return

    const url = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `qr-code-${orderId}.png`
    link.href = url
    link.click()
  }

  const isPickup = type === 'pickup'
  const title = isPickup ? 'رمز الاستلام من المتجر' : 'رمز التوصيل للعميل'
  const subtitle = isPickup
    ? '📦 يقوم المندوب بمسح هذا الرمز عند استلام الطلب'
    : '🚚 يقوم العميل بمسح هذا الرمز عند استلام الطلب'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600">{subtitle}</p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden">
        {/* Status Banner */}
        <div
          className={`px-6 py-3 ${
            expired
              ? 'bg-red-500'
              : isPickup
              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
              : 'bg-gradient-to-r from-blue-500 to-indigo-500'
          }`}
        >
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              {expired ? (
                <>
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-bold">منتهي الصلاحية</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-bold">ساري المفعول</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{timeRemaining}</span>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="p-8">
          <div className="flex flex-col items-center">
            {/* QR Code */}
            <div
              ref={qrRef}
              className={`p-6 bg-white rounded-xl border-4 ${
                expired
                  ? 'border-red-300 opacity-50 grayscale'
                  : isPickup
                  ? 'border-green-300'
                  : 'border-blue-300'
              } shadow-lg mb-6`}
            >
              <QRCode
                value={qrData}
                size={256}
                level="H"
                includeMargin={true}
                renderAs="canvas"
              />
            </div>

            {/* OTP Display */}
            <div className="w-full max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                أو استخدم رمز التحقق (OTP)
              </label>
              <div className="flex gap-2">
                <div
                  className={`flex-1 px-6 py-4 rounded-xl border-2 text-center ${
                    expired
                      ? 'bg-red-50 border-red-300'
                      : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300'
                  }`}
                >
                  <div
                    className={`text-3xl font-bold tracking-widest ${
                      expired ? 'text-red-600' : 'text-purple-600'
                    }`}
                  >
                    {formatOTP(otp)}
                  </div>
                </div>
                <button
                  onClick={handleCopyOTP}
                  disabled={expired}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    copied
                      ? 'bg-green-500 text-white'
                      : expired
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  title="نسخ الرمز"
                >
                  {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleDownloadQR}
                disabled={expired}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                  expired
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : isPickup
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                }`}
              >
                <Download className="w-5 h-5" />
                تحميل QR Code
              </button>
            </div>
          </div>
        </div>

        {/* Order Info */}
        {orderInfo && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <h3 className="font-bold text-gray-900 mb-3">معلومات الطلب</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">رقم الطلب:</span>
                <p className="font-bold text-gray-900">#{orderId.slice(0, 8)}</p>
              </div>
              {orderInfo.total && (
                <div>
                  <span className="text-gray-600">المبلغ الإجمالي:</span>
                  <p className="font-bold text-gray-900">
                    {orderInfo.total.toFixed(2)} ر.س
                  </p>
                </div>
              )}
              {orderInfo.items && (
                <div>
                  <span className="text-gray-600">عدد المنتجات:</span>
                  <p className="font-bold text-gray-900">{orderInfo.items} منتج</p>
                </div>
              )}
              {orderInfo.customerName && (
                <div>
                  <span className="text-gray-600">العميل:</span>
                  <p className="font-bold text-gray-900">{orderInfo.customerName}</p>
                </div>
              )}
              {orderInfo.vendorName && (
                <div>
                  <span className="text-gray-600">المتجر:</span>
                  <p className="font-bold text-gray-900">{orderInfo.vendorName}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div
        className={`rounded-xl p-4 border-2 ${
          isPickup
            ? 'bg-green-50 border-green-200'
            : 'bg-blue-50 border-blue-200'
        }`}
      >
        <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
          💡 تعليمات الاستخدام
        </h4>
        <ul className="text-sm text-gray-700 space-y-1">
          {isPickup ? (
            <>
              <li>• اعرض هذا الرمز للمندوب عند وصوله</li>
              <li>• يمكن للمندوب مسح QR أو إدخال رمز OTP</li>
              <li>• الرمز صالح لمدة 15 دقيقة من وقت الإنشاء</li>
              <li>• سيتم تحديث حالة الطلب تلقائياً بعد المسح</li>
            </>
          ) : (
            <>
              <li>• اعرض هذا الرمز للعميل عند التوصيل</li>
              <li>• يمكن للعميل مسح QR أو إدخال رمز OTP</li>
              <li>• الرمز صالح لمدة 30 دقيقة من وقت الإنشاء</li>
              <li>• يمكن طلب توقيع العميل وصورة للتوثيق</li>
            </>
          )}
        </ul>
      </div>

      {/* Expired Warning */}
      {expired && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-red-900 mb-1">انتهت صلاحية الرمز</h4>
              <p className="text-sm text-red-700">
                يرجى إنشاء رمز جديد لإكمال عملية {isPickup ? 'الاستلام' : 'التوصيل'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
