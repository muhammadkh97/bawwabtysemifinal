/**
 * Order Helpers - دوال مساعدة لإدارة دورة الطلب
 */

import { supabase } from './supabase';

// أنواع الحالات المسموح بها
export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'preparing'
  | 'ready'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'shipped'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded';

// واجهة بيانات الطلب الكاملة
export interface OrderData {
  id: string;
  customer_id: string;
  vendor_id?: string;
  driver_id?: string;
  status: OrderStatus;
  total_amount: number;
  delivery_fee?: number;
  pickup_qr_code?: string;
  pickup_otp?: string;
  pickup_otp_expires_at?: string;
  delivery_qr_code?: string;
  delivery_otp?: string;
  delivery_otp_expires_at?: string;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  processing_at?: string;
  ready_at?: string;
  picked_up_at?: string;
  shipped_at?: string;
  out_for_delivery_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  refunded_at?: string;
}

// واجهة بيانات تحديث الطلب
export interface OrderUpdateData {
  status: OrderStatus;
  updated_at: string;
  confirmed_at?: string;
  processing_at?: string;
  ready_at?: string;
  picked_up_at?: string;
  shipped_at?: string;
  out_for_delivery_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  refunded_at?: string;
  pickup_qr_code?: string;
  pickup_otp?: string;
  pickup_otp_expires_at?: string;
  delivery_qr_code?: string;
  delivery_otp?: string;
  delivery_otp_expires_at?: string;
  driver_id?: string;
}

// دالة مساعدة لاستخراج رسائل الأخطاء
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'حدث خطأ غير متوقع';
}

// خريطة الانتقالات المسموحة بين الحالات
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'preparing', 'cancelled'],
  processing: ['preparing', 'ready', 'ready_for_pickup', 'cancelled'],
  preparing: ['ready', 'ready_for_pickup', 'cancelled'],
  ready: ['ready_for_pickup', 'shipped', 'cancelled'],
  ready_for_pickup: ['picked_up', 'cancelled'],
  picked_up: ['in_transit', 'out_for_delivery', 'cancelled'],
  shipped: ['in_transit', 'out_for_delivery', 'cancelled'],
  in_transit: ['out_for_delivery', 'delivered', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: ['completed', 'refunded'],
  completed: ['refunded'],
  cancelled: [],
  refunded: [],
};

// خريطة أسماء الحقول الزمنية لكل حالة
const STATUS_TIMESTAMP_FIELDS: Partial<Record<OrderStatus, keyof OrderUpdateData>> = {
  confirmed: 'confirmed_at',
  processing: 'processing_at',
  preparing: 'processing_at',
  ready: 'ready_at',
  ready_for_pickup: 'ready_at',
  picked_up: 'picked_up_at',
  shipped: 'shipped_at',
  out_for_delivery: 'out_for_delivery_at',
  delivered: 'delivered_at',
  cancelled: 'cancelled_at',
  refunded: 'refunded_at',
};

/**
 * التحقق من صلاحية الانتقال بين الحالات
 */
export function isValidTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
  const allowedStatuses = ALLOWED_TRANSITIONS[currentStatus];
  return allowedStatuses.includes(newStatus);
}

/**
 * توليد رمز OTP عشوائي (6 أرقام)
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * توليد رمز QR فريد
 */
export function generateQRCode(orderId: string, type: 'pickup' | 'delivery'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${type.toUpperCase()}-${orderId.substring(0, 8)}-${timestamp}-${random}`;
}

/**
 * توليد أكواد التحقق للطلب (QR + OTP)
 */
export async function generateVerificationCodes(orderId: string): Promise<{
  pickup_qr_code: string;
  pickup_otp: string;
  delivery_qr_code: string;
  delivery_otp: string;
  pickup_otp_expires_at: string;
  delivery_otp_expires_at: string;
}> {
  const now = new Date();
  const expiresIn24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return {
    pickup_qr_code: generateQRCode(orderId, 'pickup'),
    pickup_otp: generateOTP(),
    delivery_qr_code: generateQRCode(orderId, 'delivery'),
    delivery_otp: generateOTP(),
    pickup_otp_expires_at: expiresIn24Hours.toISOString(),
    delivery_otp_expires_at: expiresIn24Hours.toISOString(),
  };
}

/**
 * تحديث حالة الطلب مع جميع الإجراءات المطلوبة
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  userId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. جلب الطلب الحالي
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single<OrderData>();

    if (fetchError || !order) {
      return { success: false, error: 'الطلب غير موجود' };
    }

    const currentStatus = order.status;

    // 2. التحقق من صلاحية الانتقال
    if (!isValidTransition(currentStatus, newStatus)) {
      return { 
        success: false, 
        error: `لا يمكن تغيير الحالة من ${currentStatus} إلى ${newStatus}` 
      };
    }

    // 3. تحضير البيانات للتحديث
    const updateData: OrderUpdateData = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    // إضافة الحقل الزمني المناسب
    const timestampField = STATUS_TIMESTAMP_FIELDS[newStatus];
    if (timestampField) {
      (updateData as Record<string, string | undefined>)[timestampField] = new Date().toISOString();
    }

    // 4. توليد أكواد التحقق إذا كانت الحالة ready_for_pickup
    if (newStatus === 'ready_for_pickup') {
      const codes = await generateVerificationCodes(orderId);
      Object.assign(updateData, codes);
    }

    // 5. تحديث الطلب
    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order:', updateError);
      return { success: false, error: 'فشل تحديث الطلب' };
    }

    // 6. إنشاء سجل في order_status_history
    await supabase.from('order_status_history').insert({
      order_id: orderId,
      status: newStatus,
      created_by: userId,
      notes: notes || null,
      created_at: new Date().toISOString(),
    });

    return { success: true };
  } catch (error: unknown) {
    console.error('Error in updateOrderStatus:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * قبول الطلب من قبل المندوب
 */
export async function acceptOrderByDriver(
  orderId: string,
  driverId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. التحقق من أن الطلب جاهز للاستلام
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single<OrderData>();

    if (fetchError || !order) {
      return { success: false, error: 'الطلب غير موجود' };
    }

    if (order.status !== 'ready_for_pickup' && order.status !== 'ready') {
      return { success: false, error: 'الطلب غير جاهز للاستلام' };
    }

    // 2. التحقق من أن المندوب غير مشغول
    const { data: activeAssignments } = await supabase
      .from('delivery_assignments')
      .select('id')
      .eq('driver_id', driverId)
      .in('status', ['accepted', 'picked_up', 'in_transit']);

    if (activeAssignments && activeAssignments.length > 0) {
      return { success: false, error: 'لديك طلبات نشطة بالفعل' };
    }

    // 3. حساب رسوم التوصيل وأرباح المندوب
    const deliveryFee = order.delivery_fee || 0;
    const platformFee = deliveryFee * 0.2; // 20% عمولة المنصة
    const driverEarning = deliveryFee - platformFee;

    // 4. إنشاء سجل في delivery_assignments
    const { error: assignError } = await supabase
      .from('delivery_assignments')
      .insert({
        order_id: orderId,
        driver_id: driverId,
        status: 'accepted',
        delivery_fee: deliveryFee,
        driver_earning: driverEarning,
        platform_fee: platformFee,
        assigned_at: new Date().toISOString(),
        accepted_at: new Date().toISOString(),
      });

    if (assignError) {
      console.error('Error creating assignment:', assignError);
      return { success: false, error: 'فشل قبول الطلب' };
    }

    // 5. تحديث driver_id في جدول orders
    await supabase
      .from('orders')
      .update({ driver_id: driverId })
      .eq('id', orderId);

    return { success: true };
  } catch (error: unknown) {
    console.error('Error in acceptOrderByDriver:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * التحقق من كود الاستلام (QR أو OTP)
 */
export async function verifyPickupCode(
  orderId: string,
  _driverId: string,
  code: string,
  type: 'qr' | 'otp'
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. جلب الطلب
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single<OrderData>();

    if (fetchError || !order) {
      return { success: false, error: 'الطلب غير موجود' };
    }

    // 2. التحقق من الكود
    let isValid = false;
    if (type === 'qr') {
      isValid = order.pickup_qr_code === code;
    } else {
      // التحقق من OTP والتاريخ
      isValid = order.pickup_otp === code;
      if (isValid && order.pickup_otp_expires_at) {
        const expiresAt = new Date(order.pickup_otp_expires_at);
        if (expiresAt < new Date()) {
          return { success: false, error: 'انتهت صلاحية الكود' };
        }
      }
    }

    if (!isValid) {
      return { success: false, error: 'الكود غير صحيح' };
    }

    return { success: true };
  } catch (error: unknown) {
    console.error('Error in verifyPickupCode:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}
