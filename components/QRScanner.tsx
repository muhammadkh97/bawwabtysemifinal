'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Camera, X, AlertCircle, CheckCircle, Keyboard } from 'lucide-react'
import { validateQRData } from '@/lib/qrOtpUtils'

interface QRScannerProps {
  /** Callback when QR code is successfully scanned */
  onScan: (data: string) => void
  /** Callback when scanning fails */
  onError?: (error: string) => void
  /** Expected QR type to validate */
  expectedType?: 'pickup' | 'delivery'
  /** Show manual OTP input option */
  showManualInput?: boolean
  /** Callback for manual OTP submission */
  onManualSubmit?: (otp: string) => void
}

export default function QRScanner({
  onScan,
  onError,
  expectedType,
  showManualInput = true,
  onManualSubmit,
}: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [manualOTP, setManualOTP] = useState('')
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string>('')

  // Get available cameras
  useEffect(() => {
    interface CameraDevice {
      id: string;
      label: string;
    }

    Html5Qrcode.getCameras()
      .then((devices: CameraDevice[]) => {
        if (devices && devices.length > 0) {
          setCameras(
            devices.map((device) => ({
              id: device.id,
              label: device.label || `كاميرا ${device.id}`,
            }))
          )
          // Select back camera by default
          const backCamera = devices.find((d) =>
            d.label.toLowerCase().includes('back')
          )
          setSelectedCamera(backCamera?.id || devices[0].id)
        }
      })
      .catch((err: unknown) => {
        console.error('Error getting cameras:', err)
        setError('لم يتم العثور على كاميرا')
      })
  }, [])

  // Start scanning
  const startScanning = async () => {
    try {
      setError('')
      setSuccess(false)

      if (!selectedCamera) {
        setError('يرجى تحديد كاميرا')
        return
      }

      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner

      await scanner.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          // Successfully scanned
          handleScanSuccess(decodedText)
        },
        (errorMessage: string) => {
          // Ignore decoding errors (happens continuously while scanning)
          // console.log('Scan error:', errorMessage)
        }
      )

      setIsScanning(true)
    } catch (err: unknown) {
      console.error('Error starting scanner:', err)
      const errorMessage = err instanceof Error ? err.message : 'خطأ غير معروف'
      setError('فشل تشغيل الكاميرا: ' + errorMessage)
    }
  }

  // Stop scanning
  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current = null
        setIsScanning(false)
      } catch (err) {
        console.error('Error stopping scanner:', err)
      }
    }
  }

  // Handle successful scan
  const handleScanSuccess = async (qrData: string) => {
    await stopScanning()

    // Validate QR data
    const validation = validateQRData(qrData)

    if (!validation.valid) {
      setError(validation.error || 'رمز QR غير صالح')
      if (onError) onError(validation.error || 'Invalid QR code')
      return
    }

    // Check expected type
    if (expectedType && validation.data?.type !== expectedType) {
      const typeNames = { pickup: 'استلام', delivery: 'توصيل' }
      setError(
        `نوع الرمز غير صحيح. متوقع: ${typeNames[expectedType]}, وجد: ${
          typeNames[validation.data?.type as 'pickup' | 'delivery']
        }`
      )
      if (onError) onError('Wrong QR type')
      return
    }

    // Success!
    setSuccess(true)
    onScan(qrData)
  }

  // Handle manual OTP submission
  const handleManualSubmit = () => {
    if (manualOTP.length !== 6) {
      setError('رمز OTP يجب أن يكون 6 أرقام')
      return
    }

    if (!/^\d{6}$/.test(manualOTP)) {
      setError('رمز OTP يجب أن يحتوي على أرقام فقط')
      return
    }

    setError('')
    if (onManualSubmit) {
      onManualSubmit(manualOTP)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error)
      }
    }
  }, [])

  return (
    <div className="space-y-4">
      {/* Scanner Section */}
      {!showManual && (
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Camera className="w-6 h-6" />
              مسح QR Code
            </h3>
          </div>

          {/* Scanner Area */}
          <div className="p-6">
            {!isScanning ? (
              <div className="space-y-4">
                {/* Camera Selection */}
                {cameras.length > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      اختر الكاميرا
                    </label>
                    <select
                      value={selectedCamera}
                      onChange={(e) => setSelectedCamera(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {cameras.map((camera) => (
                        <option key={camera.id} value={camera.id}>
                          {camera.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Start Button */}
                <button
                  onClick={startScanning}
                  disabled={!selectedCamera}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-bold transition-all shadow-lg disabled:cursor-not-allowed"
                >
                  <Camera className="w-6 h-6" />
                  بدء المسح
                </button>

                {/* Placeholder */}
                <div className="aspect-square bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-dashed border-indigo-300 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Camera className="w-16 h-16 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">اضغط &quot;بدء المسح&quot; لتشغيل الكاميرا</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Scanner Element */}
                <div id="qr-reader" className="rounded-xl overflow-hidden border-4 border-indigo-300"></div>

                {/* Stop Button */}
                <button
                  onClick={stopScanning}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all"
                >
                  <X className="w-5 h-5" />
                  إيقاف المسح
                </button>

                {/* Scanning Tips */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800 text-center">
                    💡 وجّه الكاميرا نحو رمز QR وثبّتها
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual OTP Input */}
      {showManualInput && (
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Keyboard className="w-6 h-6" />
              {showManual ? 'إدخال رمز OTP' : 'أو استخدم رمز OTP'}
            </h3>
          </div>

          <div className="p-6">
            {!showManual ? (
              <button
                onClick={() => setShowManual(true)}
                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all"
              >
                استخدام رمز OTP بدلاً من المسح
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    أدخل رمز OTP المكون من 6 أرقام
                  </label>
                  <input
                    type="text"
                    value={manualOTP}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                      setManualOTP(value)
                    }}
                    maxLength={6}
                    placeholder="000000"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleManualSubmit}
                    disabled={manualOTP.length !== 6}
                    className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-xl font-bold transition-all disabled:cursor-not-allowed"
                  >
                    تأكيد
                  </button>
                  <button
                    onClick={() => {
                      setShowManual(false)
                      setManualOTP('')
                      setError('')
                    }}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold transition-all"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-red-900 mb-1">خطأ في المسح</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-green-900 mb-1">تم المسح بنجاح!</h4>
              <p className="text-sm text-green-700">جاري التحقق من الرمز...</p>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <h4 className="font-bold text-gray-900 mb-2">💡 تعليمات الاستخدام</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• اضغط &quot;بدء المسح&quot; وامنح التطبيق إذن الوصول للكاميرا</li>
          <li>• وجّه الكاميرا نحو رمز QR بشكل واضح</li>
          <li>• سيتم المسح تلقائياً عند اكتشاف الرمز</li>
          <li>• يمكنك استخدام رمز OTP اليدوي كبديل</li>
        </ul>
      </div>
    </div>
  )
}
