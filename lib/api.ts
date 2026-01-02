import { supabase } from './supabase'
import type {
  VendorProfile,
  DriverProfile,
  Product,
  Order,
  Review,
  Dispute,
  PayoutRequest,
  Transaction,
  PlatformSettings,
  ApprovalStatus,
  ProductStatus
} from '@/types'

// ============================================
// ADMIN API - إدارة البائعين
// ============================================

/**
 * جلب جميع البائعين المعلقين للموافقة
 */
export async function getPendingVendors() {
  const { data, error } = await supabase
    .from('vendors')
    .select(`
      *,
      user:users(*)
    `)
    .eq('approval_status', 'pending')
    .order('created_at', { ascending: false })

  return { data, error }
}

/**
 * الموافقة على بائع أو رفضه
 */
export async function approveVendor(
  vendorId: string,
  status: ApprovalStatus,
  rejectionReason?: string
) {
  const updates: any = {
    approval_status: status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'approved') {
    updates.approved_at = new Date().toISOString()
  }

  if (status === 'rejected' && rejectionReason) {
    updates.rejection_reason = rejectionReason
  }

  const { data, error } = await supabase
    .from('vendors')
    .update(updates)
    .eq('id', vendorId)
    .select()
    .single()

  return { data, error }
}

/**
 * جلب جميع السائقين المعلقين للموافقة
 */
export async function getPendingDrivers() {
  const { data, error } = await supabase
    .from('drivers')
    .select(`
      *,
      user:users(*)
    `)
    .eq('approval_status', 'pending')
    .order('created_at', { ascending: false })

  return { data, error }
}

/**
 * الموافقة على سائق أو رفضه
 */
export async function approveDriver(
  driverId: string,
  status: ApprovalStatus,
  rejectionReason?: string
) {
  const updates: any = {
    approval_status: status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'approved') {
    updates.approved_at = new Date().toISOString()
  }

  if (status === 'rejected' && rejectionReason) {
    updates.rejection_reason = rejectionReason
  }

  const { data, error } = await supabase
    .from('drivers')
    .update(updates)
    .eq('id', driverId)
    .select()
    .single()

  return { data, error }
}

// ============================================
// ADMIN API - إدارة المنتجات
// ============================================

/**
 * جلب المنتجات المعلقة للمراجعة
 */
export async function getPendingProducts() {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      vendor:vendors(
        *,
        user:users(*)
      ),
      category:categories(*)
    `)
    .eq('status', 'pending_review')
    .order('created_at', { ascending: false })

  return { data, error }
}

/**
 * الموافقة على منتج أو رفضه
 */
export async function approveProduct(
  productId: string,
  status: ProductStatus,
  rejectionReason?: string
) {
  const updates: any = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'approved') {
    updates.published_at = new Date().toISOString()
  }

  if (status === 'rejected' && rejectionReason) {
    updates.rejection_reason = rejectionReason
  }

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)
    .select()
    .single()

  return { data, error }
}

// ============================================
// ADMIN API - الإحصائيات والتقارير
// ============================================

/**
 * جلب إحصائيات المنصة
 */
export async function getPlatformAnalytics(period: 'today' | 'week' | 'month' | 'year' = 'month') {
  // حساب التواريخ
  const now = new Date()
  let startDate = new Date()

  switch (period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0)
      break
    case 'week':
      startDate.setDate(now.getDate() - 7)
      break
    case 'month':
      startDate.setMonth(now.getMonth() - 1)
      break
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1)
      break
  }

  // جلب الطلبات
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .eq('payment_status', 'paid')

  if (ordersError) return { data: null, error: ordersError }

  // حساب الإحصائيات
  const totalOrders = orders?.length || 0
  const totalRevenue = orders?.reduce((sum, order) => sum + order.total, 0) || 0
  const totalCommission = orders?.reduce((sum, order) => sum + (order.total * 0.1), 0) || 0

  return {
    data: {
      totalOrders,
      totalRevenue,
      totalCommission,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      period,
    },
    error: null,
  }
}

/**
 * جلب أفضل البائعين
 */
export async function getTopVendors(limit: number = 10) {
  const { data, error } = await supabase
    .from('vendors')
    .select(`
      *,
      user:users(*),
      products:products(count)
    `)
    .eq('approval_status', 'approved')
    .order('total_sales', { ascending: false })
    .limit(limit)

  return { data, error }
}

// ============================================
// ADMIN API - الإدارة المالية
// ============================================

/**
 * جلب طلبات السحب المعلقة
 */
export async function getPendingPayouts() {
  const { data, error } = await supabase
    .from('payout_requests')
    .select(`
      *,
      user:users(*)
    `)
    .eq('status', 'pending')
    .order('requested_at', { ascending: false })

  return { data, error }
}

/**
 * معالجة طلب سحب
 */
export async function processPayout(
  payoutId: string,
  status: 'completed' | 'rejected',
  rejectionReason?: string
) {
  const updates: any = {
    status,
    processed_at: new Date().toISOString(),
  }

  if (status === 'rejected' && rejectionReason) {
    updates.rejection_reason = rejectionReason
  }

  const { data, error } = await supabase
    .from('payout_requests')
    .update(updates)
    .eq('id', payoutId)
    .select()
    .single()

  // إذا تمت الموافقة، قم بتحديث رصيد المستخدم
  if (status === 'completed' && data) {
    const { error: balanceError } = await supabase.rpc('deduct_balance', {
      user_id: data.user_id,
      amount: data.amount,
    })

    if (balanceError) return { data: null, error: balanceError }
  }

  return { data, error }
}

/**
 * تحديث إعدادات المنصة
 */
export async function updatePlatformSettings(settings: Partial<PlatformSettings>) {
  const { data, error } = await supabase
    .from('platform_settings')
    .update({
      ...settings,
      updated_at: new Date().toISOString(),
    })
    .eq('id', '1') // نفترض أن هناك سجل واحد فقط
    .select()
    .single()

  return { data, error }
}

/**
 * جلب إعدادات المنصة
 */
export async function getPlatformSettings() {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('*')
    .single()

  return { data, error }
}

// ============================================
// ADMIN API - إدارة النزاعات
// ============================================

/**
 * جلب جميع النزاعات
 */
export async function getAllDisputes(status?: string) {
  let query = supabase
    .from('disputes')
    .select(`
      *,
      order:orders(*),
      buyer:users!disputes_buyer_id_fkey(*),
      vendor:users!disputes_vendor_id_fkey(*)
    `)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  return { data, error }
}

/**
 * حل نزاع
 */
export async function resolveDispute(
  disputeId: string,
  resolution: string,
  refundAmount?: number,
  resolvedBy?: string
) {
  const { data, error } = await supabase
    .from('disputes')
    .update({
      status: 'resolved',
      resolution,
      refund_amount: refundAmount,
      resolved_by: resolvedBy,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', disputeId)
    .select()
    .single()

  // إذا كان هناك استرداد، قم بتحديث الطلب
  if (refundAmount && data) {
    await supabase
      .from('orders')
      .update({
        payment_status: 'refunded',
        refund_amount: refundAmount,
      })
      .eq('id', data.order_id)
  }

  return { data, error }
}

// ============================================
// VENDOR API - إدارة المنتجات
// ============================================

/**
 * إضافة منتج جديد
 */
export async function createProduct(productData: Partial<Product>) {
  const { data, error } = await supabase
    .from('products')
    .insert({
      ...productData,
      status: 'pending_review', // يحتاج موافقة المدير
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  return { data, error }
}

/**
 * تحديث منتج
 */
export async function updateProduct(productId: string, updates: Partial<Product>) {
  const { data, error } = await supabase
    .from('products')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)
    .select()
    .single()

  return { data, error }
}

/**
 * حذف منتج
 */
export async function deleteProduct(productId: string) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)

  return { error }
}

/**
 * جلب منتجات البائع
 */
export async function getVendorProducts(vendorId: string, status?: ProductStatus) {
  let query = supabase
    .from('products')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  return { data, error }
}

// ============================================
// VENDOR API - إدارة الطلبات
// ============================================

/**
 * جلب طلبات البائع
 */
export async function getVendorOrders(vendorId: string, status?: string) {
  let query = supabase
    .from('order_items')
    .select(`
      *,
      order:orders(
        *,
        buyer:users(*)
      ),
      product:products(*)
    `)
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('order.status', status)
  }

  const { data, error } = await query
  return { data, error }
}

/**
 * تحديث حالة الطلب
 */
export async function updateOrderStatus(orderId: string, status: string) {
  const { data, error } = await supabase
    .from('orders')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single()

  return { data, error }
}

/**
 * جلب إحصائيات البائع
 */
export async function getVendorAnalytics(vendorId: string) {
  // جلب بيانات البائع
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', vendorId)
    .single()

  if (vendorError) return { data: null, error: vendorError }

  // جلب أفضل المنتجات
  const { data: topProducts } = await supabase
    .from('products')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('status', 'published')
    .order('sold_count', { ascending: false })
    .limit(5)

  return {
    data: {
      totalSales: vendor.total_sales,
      totalEarnings: vendor.total_earnings,
      balance: vendor.balance,
      rating: vendor.rating,
      topProducts: topProducts || [],
    },
    error: null,
  }
}

// ============================================
// DRIVER API
// ============================================

/**
 * جلب الطلبات المتاحة للتوصيل
 */
export async function getAvailableDeliveries() {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      buyer:users(*)
    `)
    .eq('status', 'ready_for_pickup')
    .is('driver_id', null)
    .order('created_at', { ascending: false })

  return { data, error }
}

/**
 * قبول طلب توصيل
 */
export async function acceptDelivery(orderId: string, driverId: string) {
  const { data, error } = await supabase
    .from('orders')
    .update({
      driver_id: driverId,
      status: 'picked_up',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single()

  return { data, error }
}

/**
 * تحديث موقع السائق
 */
export async function updateDriverLocation(driverId: string, lat: number, lng: number) {
  const { data, error } = await supabase
    .from('drivers')
    .update({
      current_location: { lat, lng },
      updated_at: new Date().toISOString(),
    })
    .eq('id', driverId)
    .select()
    .single()

  return { data, error }
}

// ============================================
// CATEGORIES API - إدارة التصنيفات
// ============================================

/**
 * جلب جميع التصنيفات النشطة
 */
export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select(`
      *,
      productsCount:products(count)
    `)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  // تعديل البيانات لتضمين عدد المنتجات
  const formattedData = data?.map(cat => ({
    ...cat,
    productsCount: cat.productsCount?.[0]?.count || 0
  }))

  return { data: formattedData, error }
}

/**
 * جلب تصنيف حسب الـ slug
 */
export async function getCategoryBySlug(slug: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  return { data, error }
}

/**
 * جلب المنتجات حسب التصنيف
 */
export async function getProductsByCategory(categoryId: string) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      vendor:vendors(
        id,
        shop_name,
        rating
      ),
      categories!products_category_id_fkey(
        name,
        name_ar
      )
    `)
    .eq('category_id', categoryId)
    .eq('status', 'approved')
    .gt('stock', 0)
    .order('total_sales', { ascending: false })

  return { data, error }
}

/**
 * جلب التصنيفات الشائعة (الأكثر منتجات)
 */
export async function getPopularCategories(limit: number = 6) {
  const { data, error } = await supabase
    .from('categories')
    .select(`
      *,
      productsCount:products(count)
    `)
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .limit(limit)

  const formattedData = data?.map(cat => ({
    ...cat,
    productsCount: cat.productsCount?.[0]?.count || 0
  }))

  return { data: formattedData, error }
}

