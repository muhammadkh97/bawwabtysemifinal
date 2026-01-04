import { supabase } from './supabase';

export interface DeliveryZone {
  id: string;
  name: string;
  name_ar: string;
  governorate: string;
  cities: string[];
  center_lat: number;
  center_lng: number;
  radius_km: number;
  delivery_fee: number;
  estimated_days: number;
  is_active: boolean;
}

export interface DeliveryEstimate {
  delivery_type: 'instant' | 'scheduled';
  delivery_fee: number;
  estimated_delivery: string;
  zone_id: string;
  zone_name: string;
  zone_name_ar: string;
}

/**
 * الحصول على جميع مناطق التوصيل النشطة
 */
export async function getActiveDeliveryZones(): Promise<DeliveryZone[]> {
  const { data, error } = await supabase
    .from('delivery_zones')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching delivery zones:', error);
    return [];
  }

  return data || [];
}

/**
 * إيجاد المنطقة الأقرب بناءً على الإحداثيات أو اسم المدينة
 */
export async function findDeliveryZone(
  lat?: number,
  lng?: number,
  city?: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('find_delivery_zone', {
      p_lat: lat || null,
      p_lng: lng || null,
      p_city: city || null,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error finding delivery zone:', error);
    return null;
  }
}

/**
 * حساب رسوم التوصيل
 */
export async function calculateDeliveryFee(
  zoneId: string,
  deliveryType: 'instant' | 'scheduled',
  subtotal: number
): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('calculate_delivery_fee', {
      p_zone_id: zoneId,
      p_delivery_type: deliveryType,
      p_subtotal: subtotal,
    });

    if (error) throw error;
    return data || 5;
  } catch (error) {
    console.error('Error calculating delivery fee:', error);
    return 5;
  }
}

/**
 * الحصول على تقدير كامل للتوصيل
 */
export async function getDeliveryEstimate(
  vendorId: string,
  subtotal: number,
  lat?: number,
  lng?: number,
  city?: string
): Promise<DeliveryEstimate | null> {
  try {
    // تحديد نوع التوصيل
    const { data: deliveryTypeData, error: typeError } = await supabase.rpc(
      'determine_delivery_type',
      { p_vendor_id: vendorId }
    );

    if (typeError) throw typeError;
    const deliveryType = deliveryTypeData as 'instant' | 'scheduled';

    // إيجاد المنطقة
    const zoneId = await findDeliveryZone(lat, lng, city);
    if (!zoneId) {
      throw new Error('لم يتم العثور على منطقة توصيل');
    }

    // الحصول على معلومات المنطقة
    const { data: zoneData, error: zoneError } = await supabase
      .from('delivery_zones')
      .select('*')
      .eq('id', zoneId)
      .single();

    if (zoneError) throw zoneError;

    // حساب رسوم التوصيل
    const deliveryFee = await calculateDeliveryFee(
      zoneId,
      deliveryType,
      subtotal
    );

    // حساب الوقت المتوقع
    const { data: estimatedTime, error: timeError } = await supabase.rpc(
      'get_estimated_delivery',
      {
        p_delivery_type: deliveryType,
        p_zone_id: zoneId,
      }
    );

    if (timeError) throw timeError;

    return {
      delivery_type: deliveryType,
      delivery_fee: deliveryFee,
      estimated_delivery: estimatedTime,
      zone_id: zoneId,
      zone_name: zoneData.name,
      zone_name_ar: zoneData.name_ar,
    };
  } catch (error) {
    console.error('Error getting delivery estimate:', error);
    return null;
  }
}

/**
 * الحصول على معلومات المنطقة حسب المدينة
 */
export async function getZoneByCity(city: string): Promise<DeliveryZone | null> {
  try {
    const { data, error } = await supabase
      .from('delivery_zones')
      .select('*')
      .contains('cities', [city])
      .eq('is_active', true)
      .limit(1)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting zone by city:', error);
    return null;
  }
}

/**
 * تنسيق نوع التوصيل للعرض
 */
export function formatDeliveryType(type: 'instant' | 'scheduled'): string {
  return type === 'instant' ? 'توصيل فوري' : 'توصيل مجدول';
}

/**
 * تنسيق وقت التوصيل المتوقع
 */
export function formatEstimatedDelivery(
  deliveryType: 'instant' | 'scheduled',
  estimatedTime: string
): string {
  const date = new Date(estimatedTime);
  
  if (deliveryType === 'instant') {
    return `خلال ${Math.round((date.getTime() - Date.now()) / (1000 * 60))} دقيقة`;
  }
  
  const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  if (days === 1) return 'غداً';
  if (days === 2) return 'بعد غد';
  return `خلال ${days} أيام`;
}

/**
 * الحصول على أيقونة نوع التوصيل
 */
export function getDeliveryTypeIcon(type: 'instant' | 'scheduled'): string {
  return type === 'instant' ? '⚡' : '📦';
}

/**
 * الحصول على لون نوع التوصيل
 */
export function getDeliveryTypeColor(type: 'instant' | 'scheduled'): string {
  return type === 'instant' 
    ? 'bg-gradient-to-r from-orange-500 to-red-500' 
    : 'bg-gradient-to-r from-blue-500 to-purple-500';
}
