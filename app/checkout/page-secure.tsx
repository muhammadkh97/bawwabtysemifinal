/**
 * صفحة Checkout المحدثة - تستخدم الدالة الآمنة create_order_secure
 * Updated Checkout Page - Uses secure create_order_secure function
 * 
 * التغييرات الرئيسية:
 * 1. إزالة جميع حسابات الأسعار من Frontend
 * 2. استخدام RPC function بدلاً من insert مباشر
 * 3. إرسال بيانات السلة فقط بدون أسعار
 */

// استيراد الدوال المساعدة
import { supabase } from '@/lib/supabase';

/**
 * دالة إنشاء الطلب الآمنة
 * Secure Order Creation Function
 */
async function createOrderSecure(
  customerId: string,
  cartItems: any[],
  deliveryAddress: string,
  deliveryCity: string,
  deliveryPhone: string,
  paymentMethod: string,
  couponCode?: string,
  notes?: string
) {
  // استخدام supabase client المستورد
  
  // تحويل عناصر السلة إلى الصيغة المطلوبة
  const cartItemsFormatted = cartItems.map(item => ({
    product_id: item.product?.id,
    quantity: item.quantity,
    store_id: item.product?.vendor_id // أو store_id حسب البنية
  }));
  
  // استدعاء الدالة الآمنة
  const { data, error } = await supabase.rpc('create_order_secure', {
    p_customer_id: customerId,
    p_cart_items: cartItemsFormatted,
    p_delivery_address: deliveryAddress,
    p_delivery_city: deliveryCity,
    p_delivery_phone: deliveryPhone,
    p_payment_method: paymentMethod,
    p_coupon_code: couponCode || null,
    p_notes: notes || null
  });
  
  if (error) {
    console.error('Error creating order:', error);
    return { success: false, error: error.message };
  }
  
  // التحقق من نجاح العملية
  if (!data || !data.success) {
    return {
      success: false,
      error: data?.error || 'unknown_error',
      message: data?.message || 'حدث خطأ غير معروف'
    };
  }
  
  return {
    success: true,
    order_id: data.order_id,
    order_number: data.order_number,
    subtotal: data.subtotal,
    shipping: data.shipping,
    tax: data.tax,
    discount: data.discount,
    total: data.total,
    items: data.items
  };
}

/**
 * مثال على استخدام الدالة في handleCheckout
 */
async function handleCheckout(
  user: any,
  cartItems: any[],
  formData: any,
  appliedCoupon: any
) {
  try {
    // استدعاء الدالة الآمنة
    const result = await createOrderSecure(
      user.id,
      cartItems,
      `${formData.address}, ${formData.city}`,
      formData.city,
      formData.phone,
      formData.paymentMethod,
      appliedCoupon?.code,
      formData.notes
    );
    
    if (!result.success) {
      // معالجة الأخطاء المختلفة
      switch (result.error) {
        case 'empty_cart':
          alert('❌ السلة فارغة');
          break;
        case 'invalid_quantity':
          alert('❌ الكمية غير صحيحة');
          break;
        case 'product_not_found':
          alert('❌ المنتج غير موجود أو غير متاح');
          break;
        case 'insufficient_stock':
          alert('❌ المخزون غير كافي');
          break;
        case 'invalid_coupon':
          alert('❌ كوبون الخصم غير صالح');
          break;
        case 'min_purchase_not_met':
          alert(`❌ ${result.message}`);
          break;
        default:
          alert(`❌ حدث خطأ: ${result.message || result.error}`);
      }
      return null;
    }
    
    // نجحت العملية
    console.log('Order created successfully:', result);
    
    // مسح السلة
    localStorage.removeItem('cart');
    
    // إعادة التوجيه إلى صفحة النجاح
    window.location.href = `/orders/${result.order_id}?success=true`;
    
    return result;
    
  } catch (error) {
    console.error('Checkout error:', error);
    alert('❌ حدث خطأ أثناء إتمام الطلب');
    return null;
  }
}

/**
 * ملاحظات مهمة للتطبيق:
 * 
 * 1. إزالة جميع الحسابات من Frontend:
 *    - احذف حساب subtotal, shipping, tax, discount, total
 *    - لا ترسل أي أسعار من Frontend
 * 
 * 2. التحقق من الأخطاء:
 *    - تحقق من result.success قبل المتابعة
 *    - اعرض رسائل خطأ واضحة للمستخدم
 * 
 * 3. معالجة الكوبونات:
 *    - أرسل كود الكوبون فقط (string)
 *    - لا تحسب قيمة الخصم في Frontend
 * 
 * 4. التحديثات المطلوبة في الملف الأصلي:
 *    - استبدل كل منطق handleCheckout بالكود أعلاه
 *    - احذف دوال حساب الأسعار
 *    - احذف استدعاءات supabase.from('orders').insert()
 *    - استخدم createOrderSecure بدلاً منها
 */

export { createOrderSecure, handleCheckout };
