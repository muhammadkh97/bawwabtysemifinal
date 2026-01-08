/**
 * Order Helpers - دوال مساعدة لإدارة دورة الطلب
 * 
 * هذا الملف يحتوي على جميع الدوال المساعدة لإدارة دورة حياة الطلب
 * من البداية حتى النهاية مع التحقق من الحالات والإشعارات
 */

import { supabase } from './supabase';

// واجهة بيانات تحديث الطلب
interface OrderUpdateData {
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
  [key: string]: string | undefined;
}

// دالة مساعدة لاستخراج رسائل الأخطاء
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'حدث خطأ غير متوقع';
}

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
const STATUS_TIMESTAMP_FIELDS: Partial<Record<OrderStatus, string>> = {
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
      .single();

    if (fetchError || !order) {
      return { success: false, error: 'الطلب غير موجود' };
    }

    const currentStatus = order.status as OrderStatus;

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
      updateData[timestampField] = new Date().toISOString();
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

    // 7. إرسال الإشعارات المناسبة
    await sendOrderStatusNotifications(orderId, newStatus, order);

    // 8. إجراءات إضافية حسب الحالة
    if (newStatus === 'ready_for_pickup') {
      // إشعار المندوبين المتاحين
      await notifyAvailableDrivers(orderId);
    } else if (newStatus === 'delivered') {
      // تحديث المحافظ ومنح نقاط الولاء
      await processDeliveryCompletion(orderId, order);
    }

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
      .single();

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

    // 6. إرسال إشعارات
    await sendDriverAcceptanceNotifications(orderId, order);

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
  driverId: string,
  code: string,
  type: 'qr' | 'otp'
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. جلب الطلب
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

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

    // 3. تحديث حالة الطلب إلى picked_up
    const result = await updateOrderStatus(orderId, 'picked_up', driverId);
    if (!result.success) {
      return result;
    }

    // 4. تحديث picked_up_by
    await supabase
      .from('orders')
      .update({ picked_up_by: driverId })
      .eq('id', orderId);

    // 5. تحديث delivery_assignments
    await supabase
      .from('delivery_assignments')
      .update({
        status: 'picked_up',
        picked_up_at: new Date().toISOString(),
      })
      .eq('order_id', orderId)
      .eq('driver_id', driverId);

    return { success: true };
  } catch (error: unknown) {
    console.error('Error in verifyPickupCode:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * التحقق من كود التسليم (QR أو OTP)
 */
export async function verifyDeliveryCode(
  orderId: string,
  code: string,
  type: 'qr' | 'otp',
  customerId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. جلب الطلب
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return { success: false, error: 'الطلب غير موجود' };
    }

    // 2. التحقق من الكود
    let isValid = false;
    if (type === 'qr') {
      isValid = order.delivery_qr_code === code;
    } else {
      isValid = order.delivery_otp === code;
      if (isValid && order.delivery_otp_expires_at) {
        const expiresAt = new Date(order.delivery_otp_expires_at);
        if (expiresAt < new Date()) {
          return { success: false, error: 'انتهت صلاحية الكود' };
        }
      }
    }

    if (!isValid) {
      return { success: false, error: 'الكود غير صحيح' };
    }

    // 3. تحديث حالة الطلب إلى delivered
    const result = await updateOrderStatus(orderId, 'delivered', customerId || order.customer_id);
    if (!result.success) {
      return result;
    }

    // 4. تحديث delivered_to
    if (customerId) {
      await supabase
        .from('orders')
        .update({ delivered_to: customerId })
        .eq('id', orderId);
    }

    // 5. تحديث delivery_assignments
    await supabase
      .from('delivery_assignments')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString(),
      })
      .eq('order_id', orderId);

    // 6. معالجة اكتمال التسليم (المحافظ والنقاط)
    await processDeliveryCompletion(orderId, order);

    return { success: true };
  } catch (error: unknown) {
    console.error('Error in verifyDeliveryCode:', error);
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * إرسال إشعارات تغيير حالة الطلب
 */
async function sendOrderStatusNotifications(
  orderId: string,
  newStatus: OrderStatus,
  order: any
): Promise<void> {
  try {
    const statusMessages: Partial<Record<OrderStatus, string>> = {
      confirmed: 'تم تأكيد طلبك',
      preparing: 'جاري تحضير طلبك',
      ready_for_pickup: 'طلبك جاهز للاستلام',
      picked_up: 'تم استلام طلبك من قبل المندوب',
      in_transit: 'طلبك في الطريق إليك',
      out_for_delivery: 'المندوب في طريقه لتوصيل طلبك',
      delivered: 'تم تسليم طلبك بنجاح',
      cancelled: 'تم إلغاء طلبك',
    };

    const message = statusMessages[newStatus];
    if (!message) return;

    // إرسال إشعار للعميل
    await supabase.from('notifications').insert({
      user_id: order.customer_id,
      title: 'تحديث حالة الطلب',
      message: `${message} - رقم الطلب: ${order.order_number}`,
      type: 'order_update',
      priority: 'high',
      category: 'orders',
      data: { order_id: orderId, status: newStatus },
      is_read: false,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
}

/**
 * إشعار المندوبين المتاحين بطلب جديد
 */
async function notifyAvailableDrivers(orderId: string): Promise<void> {
  try {
    // جلب المندوبين المتاحين (يمكن تحسينها بإضافة فلترة حسب الموقع)
    const { data: drivers } = await supabase
      .from('drivers')
      .select('user_id')
      .eq('approval_status', 'approved')
      .eq('is_available', true);

    if (!drivers || drivers.length === 0) return;

    // إرسال إشعار لكل مندوب
    const notifications = drivers.map((driver) => ({
      user_id: driver.user_id,
      title: 'طلب توصيل جديد',
      message: 'يوجد طلب توصيل جديد متاح في منطقتك',
      type: 'new_order',
      priority: 'high',
      category: 'orders',
      data: { order_id: orderId },
      is_read: false,
      created_at: new Date().toISOString(),
    }));

    await supabase.from('notifications').insert(notifications);
  } catch (error) {
    console.error('Error notifying drivers:', error);
  }
}

/**
 * إرسال إشعارات قبول المندوب للطلب
 */
async function sendDriverAcceptanceNotifications(orderId: string, order: any): Promise<void> {
  try {
    // إشعار العميل
    await supabase.from('notifications').insert({
      user_id: order.customer_id,
      title: 'تم قبول طلبك',
      message: `تم قبول طلبك من قبل مندوب التوصيل - رقم الطلب: ${order.order_number}`,
      type: 'order_update',
      priority: 'high',
      category: 'orders',
      data: { order_id: orderId },
      is_read: false,
      created_at: new Date().toISOString(),
    });

    // إشعار البائع (يحتاج جلب vendor_id من order_items)
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('vendor_id')
      .eq('order_id', orderId)
      .limit(1);

    if (orderItems && orderItems.length > 0) {
      const { data: vendor } = await supabase
        .from('stores')
        .select('user_id')
        .eq('id', orderItems[0].vendor_id)
        .single();

      if (vendor) {
        await supabase.from('notifications').insert({
          user_id: vendor.user_id,
          title: 'تم قبول الطلب للتوصيل',
          message: `تم قبول الطلب ${order.order_number} من قبل مندوب التوصيل`,
          type: 'order_update',
          priority: 'normal',
          category: 'orders',
          data: { order_id: orderId },
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error('Error sending acceptance notifications:', error);
  }
}

/**
 * معالجة اكتمال التسليم (تحديث المحافظ ومنح النقاط)
 */
async function processDeliveryCompletion(orderId: string, order: any): Promise<void> {
  try {
    // 1. تحديث محفظة البائع
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('vendor_id, vendor_earning')
      .eq('order_id', orderId);

    if (orderItems) {
      for (const item of orderItems) {
        // إضافة الأرباح لمحفظة البائع
        await supabase.rpc('add_wallet_credit', {
          p_user_id: item.vendor_id,
          p_amount: item.vendor_earning,
          p_category: 'order_payment',
          p_description: `أرباح من الطلب ${order.order_number}`,
        });
      }
    }

    // 2. تحديث محفظة المندوب
    const { data: assignment } = await supabase
      .from('delivery_assignments')
      .select('driver_id, driver_earning')
      .eq('order_id', orderId)
      .single();

    if (assignment) {
      await supabase.rpc('add_wallet_credit', {
        p_user_id: assignment.driver_id,
        p_amount: assignment.driver_earning,
        p_category: 'delivery_payment',
        p_description: `أجرة توصيل الطلب ${order.order_number}`,
      });
    }

    // 3. منح نقاط الولاء للعميل
    const loyaltyPoints = Math.floor(order.total * 0.01); // 1% من قيمة الطلب
    if (loyaltyPoints > 0) {
      await supabase.from('loyalty_points').insert({
        user_id: order.customer_id,
        points: loyaltyPoints,
        type: 'earned',
        source: 'order_completion',
        reference_id: orderId,
        description: `نقاط من الطلب ${order.order_number}`,
        created_at: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error processing delivery completion:', error);
  }
}
