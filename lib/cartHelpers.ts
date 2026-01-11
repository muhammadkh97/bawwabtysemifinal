import { supabase } from './supabase';
import { logger } from '@/lib/logger';

/**
 * تحديد نوع السلة المناسبة للمنتج
 * @param productId معرف المنتج
 * @returns 'restaurant' أو 'products'
 */
export async function getProductCartType(productId: string): Promise<'restaurant' | 'products'> {
  try {
    const { data, error } = await supabase.rpc('get_product_cart_type', {
      p_product_id: productId
    });

    if (error) throw error;
    return data as 'restaurant' | 'products';
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error getting product cart type', { error: errorMessage, component: 'getProductCartType', productId });
    return 'products'; // افتراضي
  }
}

/**
 * التحقق من أن المتجر مطعم
 * @param vendorId معرف المتجر
 */
export async function isRestaurant(vendorId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('business_type')
      .eq('id', vendorId)
      .single();

    if (error) throw error;
    return data?.business_type === 'restaurant';
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error checking if restaurant', { error: errorMessage, component: 'isRestaurant', vendorId });
    return false;
  }
}

/**
 * إضافة منتج للسلة المناسبة تلقائياً
 */
export async function addToAppropriateCart(
  productId: string,
  vendorId: string,
  quantity: number = 1,
  addToProducts: (productId: string, quantity: number) => Promise<void>,
  addToRestaurant: (productId: string, vendorId: string, quantity: number, instructions?: string) => Promise<void>,
  specialInstructions?: string
): Promise<'restaurant' | 'products'> {
  const cartType = await getProductCartType(productId);
  
  if (cartType === 'restaurant') {
    await addToRestaurant(productId, vendorId, quantity, specialInstructions);
  } else {
    await addToProducts(productId, quantity);
  }
  
  return cartType;
}

/**
 * الحصول على أيقونة نوع المنتج
 */
export function getProductTypeIcon(type: 'restaurant' | 'products'): string {
  return type === 'restaurant' ? '🍽️' : '🛍️';
}

/**
 * الحصول على اسم نوع المنتج
 */
export function getProductTypeName(type: 'restaurant' | 'products'): string {
  return type === 'restaurant' ? 'مطعم' : 'منتج';
}

/**
 * الحصول على لون حسب نوع المنتج
 */
export function getProductTypeColor(type: 'restaurant' | 'products'): string {
  return type === 'restaurant' 
    ? 'bg-gradient-to-r from-orange-500 to-red-500'
    : 'bg-gradient-to-r from-purple-500 to-pink-500';
}
