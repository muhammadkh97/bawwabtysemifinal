# 🔐 نظام التسليم والاستلام بـ QR Code و OTP - دليل شامل

## 📋 **ملخص النظام الحالي**

### ✅ **ما تم تطبيقه:**

1. **قاعدة البيانات:**
   - ✅ أعمدة OTP و QR في جدول orders
   - ✅ أعمدة pickup_otp, pickup_qr_code, pickup_otp_expires_at
   - ✅ أعمدة delivery_otp, delivery_qr_code, delivery_otp_expires_at

2. **المكتبات (Libraries):**
   - ✅ `lib/qrOtpUtils.ts` - دوال توليد والتحقق من QR/OTP
   - ✅ `lib/orderHelpers.ts` - دوال إدارة الطلبات والتحقق

3. **المكونات (Components):**
   - ✅ `QRCodeDisplay.tsx` - عرض QR Code و OTP بشكل احترافي

4. **الوظائف الموجودة:**
   ```typescript
   // التوليد
   - generatePickupCodes(orderId)
   - generateDeliveryCodes(orderId)
   
   // التحقق
   - verifyPickupWithOTP(orderId, otp, driverId)
   - verifyDeliveryWithOTP(orderId, otp, customerId)
   - verifyPickupWithQR(qrData, driverId)
   - verifyDeliveryWithQR(qrData, customerId)
   
   // المساعدة
   - formatOTP(otp) // XXX-XXX
   - isOTPExpired(expiresAt)
   - getOTPTimeRemaining(expiresAt)
   - validateQRData(qrData)
   ```

---

## ❌ **ما ينقص من النظام:**

### 1. **Database Functions (PostgreSQL)**
- ❌ `generate_pickup_codes()` - RPC function
- ❌ `generate_delivery_codes()` - RPC function  
- ❌ `verify_pickup_otp()` - RPC function
- ❌ `verify_delivery_otp()` - RPC function

### 2. **QR Scanner Component**
- ❌ مكون لمسح QR Code باستخدام الكاميرا
- ❌ صفحة للسائق لمسح QR من البائع
- ❌ صفحة للعميل لمسح QR من السائق

### 3. **UI Screens**
- ❌ صفحة البائع لعرض QR/OTP للاستلام
- ❌ صفحة السائق لمسح/إدخال OTP للاستلام
- ❌ صفحة السائق لعرض QR/OTP للتسليم
- ❌ صفحة العميل لمسح/إدخال OTP للتسليم

### 4. **Triggers & Automation**
- ❌ Trigger لتوليد QR/OTP تلقائياً عند تأكيد الطلب
- ❌ Trigger لتحديث order status عند التحقق الناجح

---

## 🎯 **خطة التطبيق الكاملة**

### **المرحلة 1: Database Functions** ⏰ 30 دقيقة

#### 1.1 إنشاء دالة توليد أكواد الاستلام
```sql
CREATE OR REPLACE FUNCTION generate_pickup_codes(order_uuid UUID)
RETURNS TABLE (qr_code TEXT, otp VARCHAR(6), expires_at TIMESTAMPTZ)
AS $$
DECLARE
  v_otp VARCHAR(6);
  v_qr_data JSONB;
  v_expires TIMESTAMPTZ;
BEGIN
  -- توليد OTP عشوائي
  v_otp := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  
  -- تحديد وقت الانتهاء (24 ساعة)
  v_expires := NOW() + INTERVAL '24 hours';
  
  -- بناء QR data
  v_qr_data := jsonb_build_object(
    'type', 'pickup',
    'order_id', order_uuid::TEXT,
    'otp', v_otp,
    'timestamp', NOW()::TEXT
  );
  
  -- تحديث الطلب
  UPDATE orders
  SET 
    pickup_otp = v_otp,
    pickup_qr_code = v_qr_data::TEXT,
    pickup_otp_expires_at = v_expires,
    updated_at = NOW()
  WHERE id = order_uuid;
  
  -- إرجاع النتيجة
  RETURN QUERY 
  SELECT 
    v_qr_data::TEXT AS qr_code,
    v_otp AS otp,
    v_expires AS expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 1.2 إنشاء دالة توليد أكواد التسليم
```sql
CREATE OR REPLACE FUNCTION generate_delivery_codes(order_uuid UUID)
RETURNS TABLE (qr_code TEXT, otp VARCHAR(6), expires_at TIMESTAMPTZ)
AS $$
DECLARE
  v_otp VARCHAR(6);
  v_qr_data JSONB;
  v_expires TIMESTAMPTZ;
BEGIN
  v_otp := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  v_expires := NOW() + INTERVAL '24 hours';
  
  v_qr_data := jsonb_build_object(
    'type', 'delivery',
    'order_id', order_uuid::TEXT,
    'otp', v_otp,
    'timestamp', NOW()::TEXT
  );
  
  UPDATE orders
  SET 
    delivery_otp = v_otp,
    delivery_qr_code = v_qr_data::TEXT,
    delivery_otp_expires_at = v_expires,
    updated_at = NOW()
  WHERE id = order_uuid;
  
  RETURN QUERY 
  SELECT 
    v_qr_data::TEXT AS qr_code,
    v_otp AS otp,
    v_expires AS expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 1.3 دالة التحقق من OTP الاستلام
```sql
CREATE OR REPLACE FUNCTION verify_pickup_otp(
  order_uuid UUID,
  provided_otp VARCHAR(6),
  driver_id UUID
)
RETURNS BOOLEAN
AS $$
DECLARE
  v_order RECORD;
BEGIN
  -- جلب الطلب
  SELECT * INTO v_order
  FROM orders
  WHERE id = order_uuid
  AND driver_id = driver_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found or driver mismatch';
  END IF;
  
  -- التحقق من OTP
  IF v_order.pickup_otp != provided_otp THEN
    RETURN FALSE;
  END IF;
  
  -- التحقق من الصلاحية
  IF v_order.pickup_otp_expires_at < NOW() THEN
    RAISE EXCEPTION 'OTP has expired';
  END IF;
  
  -- تحديث الحالة
  UPDATE orders
  SET 
    status = 'picked_up',
    picked_up_at = NOW(),
    picked_up_by = driver_id,
    updated_at = NOW()
  WHERE id = order_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 1.4 دالة التحقق من OTP التسليم
```sql
CREATE OR REPLACE FUNCTION verify_delivery_otp(
  order_uuid UUID,
  provided_otp VARCHAR(6),
  customer_id UUID,
  signature_data TEXT DEFAULT NULL,
  photo_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN
AS $$
DECLARE
  v_order RECORD;
BEGIN
  SELECT * INTO v_order
  FROM orders
  WHERE id = order_uuid
  AND customer_id = customer_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found or customer mismatch';
  END IF;
  
  IF v_order.delivery_otp != provided_otp THEN
    RETURN FALSE;
  END IF;
  
  IF v_order.delivery_otp_expires_at < NOW() THEN
    RAISE EXCEPTION 'OTP has expired';
  END IF;
  
  UPDATE orders
  SET 
    status = 'delivered',
    delivered_at = NOW(),
    delivery_signature = signature_data,
    delivery_photo = photo_url,
    updated_at = NOW()
  WHERE id = order_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 1.5 Trigger لتوليد الأكواد تلقائياً
```sql
CREATE OR REPLACE FUNCTION auto_generate_verification_codes()
RETURNS TRIGGER AS $$
BEGIN
  -- عند تأكيد الطلب، نولد الأكواد
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    PERFORM generate_pickup_codes(NEW.id);
    PERFORM generate_delivery_codes(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_codes
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_verification_codes();
```

---

### **المرحلة 2: QR Scanner Component** ⏰ 45 دقيقة

#### 2.1 مكون ماسح QR
```tsx
// components/QRScanner.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { BrowserQRCodeReader } from '@zxing/browser'
import { Camera, X, Zap } from 'lucide-react'

interface QRScannerProps {
  onScan: (data: string) => void
  onClose: () => void
  title?: string
}

export default function QRScanner({ onScan, onClose, title }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const readerRef = useRef<BrowserQRCodeReader | null>(null)

  useEffect(() => {
    startScanning()
    return () => stopScanning()
  }, [])

  const startScanning = async () => {
    try {
      const codeReader = new BrowserQRCodeReader()
      readerRef.current = codeReader

      const videoInputDevices = await codeReader.listVideoInputDevices()
      
      if (videoInputDevices.length === 0) {
        setError('لا توجد كاميرا متاحة')
        return
      }

      // استخدام الكاميرا الخلفية إن وجدت
      const backCamera = videoInputDevices.find(device => 
        device.label.toLowerCase().includes('back')
      ) || videoInputDevices[0]

      setScanning(true)

      codeReader.decodeFromVideoDevice(
        backCamera.deviceId,
        videoRef.current!,
        (result, error) => {
          if (result) {
            onScan(result.getText())
            stopScanning()
          }
        }
      )
    } catch (err) {
      console.error('Error starting scanner:', err)
      setError('فشل في تشغيل الكاميرا')
    }
  }

  const stopScanning = () => {
    if (readerRef.current) {
      readerRef.current.reset()
    }
    setScanning(false)
  }

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">
              {title || 'مسح رمز QR'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Video Preview */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        
        {/* Scanning Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-64 h-64">
            {/* Corner Brackets */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-green-500"></div>
            <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-green-500"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-green-500"></div>
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-green-500"></div>
            
            {/* Scanning Line */}
            {scanning && (
              <div className="absolute inset-0 overflow-hidden">
                <div className="h-1 w-full bg-green-500 animate-scan"></div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-8 left-0 right-0 px-6">
          <div className="bg-black/70 backdrop-blur-md rounded-2xl p-6 text-center">
            <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-white font-bold mb-1">
              وجّه الكاميرا نحو رمز QR
            </p>
            <p className="text-white/70 text-sm">
              سيتم المسح تلقائياً عند اكتشاف الرمز
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="absolute top-20 left-4 right-4 bg-red-500 text-white p-4 rounded-lg">
          {error}
        </div>
      )}

      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(256px); }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  )
}
```

---

### **المرحلة 3: UI Screens** ⏰ 60 دقيقة

#### 3.1 صفحة البائع - عرض QR للاستلام
```tsx
// app/dashboard/vendor/orders/[id]/pickup-qr/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { generatePickupCodes } from '@/lib/qrOtpUtils'
import QRCodeDisplay from '@/components/QRCodeDisplay'
import { Package, Clock, User } from 'lucide-react'

export default function VendorPickupQRPage() {
  const params = useParams()
  const [order, setOrder] = useState<any>(null)
  const [qrData, setQrData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrderAndGenerateQR()
  }, [])

  const fetchOrderAndGenerateQR = async () => {
    try {
      // جلب الطلب
      const { data: orderData, error } = await supabase
        .from('orders')
        .select(`
          *,
          driver:users!orders_driver_id_fkey(full_name, phone)
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error
      setOrder(orderData)

      // توليد أو جلب QR
      let codes
      if (!orderData.pickup_otp || !orderData.pickup_qr_code) {
        codes = await generatePickupCodes(params.id as string)
      } else {
        codes = {
          qrCode: orderData.pickup_qr_code,
          otp: orderData.pickup_otp,
          expiresAt: new Date(orderData.pickup_otp_expires_at)
        }
      }

      setQrData(codes)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p>جاري تحميل رمز الاستلام...</p>
      </div>
    </div>
  }

  if (!qrData) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            📦 رمز استلام الطلب
          </h1>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-green-600" />
              <span className="text-gray-600">رقم الطلب:</span>
              <span className="font-bold">{order.order_number}</span>
            </div>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-green-600" />
              <span className="text-gray-600">المندوب:</span>
              <span className="font-bold">{order.driver?.full_name || 'لم يتم التعيين'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-green-600" />
              <span className="text-gray-600">الحالة:</span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold">
                {order.status === 'ready' ? 'جاهز للاستلام' : 'قيد التحضير'}
              </span>
            </div>
          </div>
        </div>

        {/* QR Display */}
        <QRCodeDisplay
          qrData={qrData.qrCode}
          otp={qrData.otp}
          expiresAt={qrData.expiresAt}
          type="pickup"
          orderId={order.order_number}
          orderInfo={{
            total: order.total,
            items: order.items?.length,
            vendorName: order.vendor?.name
          }}
        />

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
          <h3 className="font-bold text-blue-900 mb-3">📝 التعليمات:</h3>
          <ol className="space-y-2 text-blue-800">
            <li>1. اعرض هذا الرمز للمندوب عند وصوله</li>
            <li>2. سيقوم المندوب بمسح الرمز أو إدخال OTP</li>
            <li>3. بعد التحقق، سيتم تحديث حالة الطلب تلقائياً</li>
            <li>4. احتفظ بالرمز حتى استلام المندوب للطلب</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
```

#### 3.2 صفحة السائق - مسح QR من البائع
#### 3.3 صفحة السائق - عرض QR للعميل
#### 3.4 صفحة العميل - مسح QR من السائق

---

## 📊 **تتبع الحالات (Status Flow)**

```
1. Vendor prepares order → status: 'ready'
   ↓
2. QR/OTP generated automatically
   ↓
3. Driver arrives → scans QR/enters OTP
   ↓
4. Verification success → status: 'picked_up'
   ↓
5. Driver delivers → shows QR to customer
   ↓
6. Customer scans QR/enters OTP
   ↓
7. Verification success → status: 'delivered'
   ↓
8. Payment & commission processed
```

---

## 🔒 **الأمان (Security)**

1. **OTP Expiry**: 24 ساعة صلاحية
2. **QR Validation**: التحقق من البيانات والتوقيع
3. **User Verification**: التأكد من driver_id و customer_id
4. **Rate Limiting**: منع المحاولات المتكررة
5. **Encryption**: تشفير بيانات QR

---

## 📱 **التكامل مع التطبيق**

### Dependencies المطلوبة:
```json
{
  "qrcode.react": "^3.1.0",
  "@zxing/browser": "^0.1.1",
  "@zxing/library": "^0.20.0"
}
```

### Installation:
```bash
npm install qrcode.react @zxing/browser @zxing/library
```

---

## ✅ **Checklist التطبيق**

- [ ] تشغيل SQL functions في Supabase
- [ ] تثبيت dependencies
- [ ] إنشاء QRScanner component
- [ ] إنشاء صفحة البائع (pickup QR)
- [ ] إنشاء صفحة السائق (scan pickup)
- [ ] إنشاء صفحة السائق (delivery QR)
- [ ] إنشاء صفحة العميل (scan delivery)
- [ ] اختبار التدفق الكامل
- [ ] إضافة error handling
- [ ] إضافة notifications
- [ ] توثيق API

---

## 🚀 **الخطوة التالية**

سأبدأ بتطبيق كل مرحلة بالترتيب. هل تريد أن أبدأ؟
