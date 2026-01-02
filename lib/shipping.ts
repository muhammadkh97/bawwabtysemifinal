/**
 * Shipping Rate Calculator
 * حساب رسوم التوصيل بناءً على المسافة والوزن
 */

export interface ShippingLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface ShippingDetails {
  weight: number; // بالكيلوجرام
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  isFragile?: boolean;
  isExpress?: boolean;
}

export interface ShippingRate {
  distance: number; // بالكيلومتر
  baseRate: number; // الرسوم الأساسية
  weightCharge: number; // رسوم الوزن
  extraCharges: number; // رسوم إضافية
  totalCost: number; // التكلفة الإجمالية
  estimatedTime: string; // وقت التوصيل المتوقع
  carrier: string;
}

// Constants
const BASE_RATE = 2.5; // دينار أردني
const RATE_PER_KM = 0.5; // دينار لكل كيلومتر
const RATE_PER_KG = 0.3; // دينار لكل كيلوجرام
const FRAGILE_CHARGE = 1.5; // رسوم إضافية للبضائع الهشة
const EXPRESS_MULTIPLIER = 1.5; // مضاعف التوصيل السريع
const FREE_SHIPPING_THRESHOLD = 50; // دينار أردني

/**
 * حساب المسافة بين نقطتين باستخدام Haversine formula
 */
export function calculateDistance(
  origin: ShippingLocation,
  destination: ShippingLocation
): number {
  const R = 6371; // نصف قطر الأرض بالكيلومتر
  
  const lat1 = (origin.lat * Math.PI) / 180;
  const lat2 = (destination.lat * Math.PI) / 180;
  const dLat = ((destination.lat - origin.lat) * Math.PI) / 180;
  const dLon = ((destination.lng - origin.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // تقريب لأقرب 0.1 كم
}

/**
 * حساب رسوم التوصيل
 */
export function calculateShippingRate(
  origin: ShippingLocation,
  destination: ShippingLocation,
  details: ShippingDetails,
  orderTotal?: number
): ShippingRate {
  // حساب المسافة
  const distance = calculateDistance(origin, destination);

  // الرسوم الأساسية
  let baseRate = BASE_RATE;

  // رسوم المسافة
  const distanceCharge = distance * RATE_PER_KM;

  // رسوم الوزن
  const weightCharge = details.weight * RATE_PER_KG;

  // رسوم إضافية
  let extraCharges = 0;
  if (details.isFragile) {
    extraCharges += FRAGILE_CHARGE;
  }

  // حساب الإجمالي
  let totalCost = baseRate + distanceCharge + weightCharge + extraCharges;

  // التوصيل السريع
  if (details.isExpress) {
    totalCost *= EXPRESS_MULTIPLIER;
  }

  // توصيل مجاني للطلبات الكبيرة
  if (orderTotal && orderTotal >= FREE_SHIPPING_THRESHOLD) {
    totalCost = 0;
  }

  // تقدير وقت التوصيل
  let estimatedTime = '';
  if (details.isExpress) {
    estimatedTime = 'خلال 2-4 ساعات';
  } else if (distance < 10) {
    estimatedTime = 'خلال 24 ساعة';
  } else if (distance < 30) {
    estimatedTime = 'خلال 1-2 يوم';
  } else {
    estimatedTime = 'خلال 2-3 أيام';
  }

  return {
    distance,
    baseRate,
    weightCharge,
    extraCharges,
    totalCost: Math.round(totalCost * 100) / 100,
    estimatedTime,
    carrier: 'بوابتي - خدمة التوصيل',
  };
}

/**
 * الحصول على خيارات التوصيل المتعددة
 */
export function getShippingOptions(
  origin: ShippingLocation,
  destination: ShippingLocation,
  details: ShippingDetails,
  orderTotal?: number
): ShippingRate[] {
  const options: ShippingRate[] = [];

  // التوصيل العادي
  const standardShipping = calculateShippingRate(
    origin,
    destination,
    { ...details, isExpress: false },
    orderTotal
  );
  options.push({
    ...standardShipping,
    carrier: 'توصيل عادي',
  });

  // التوصيل السريع
  const expressShipping = calculateShippingRate(
    origin,
    destination,
    { ...details, isExpress: true },
    orderTotal
  );
  options.push({
    ...expressShipping,
    carrier: 'توصيل سريع',
  });

  return options;
}

/**
 * Google Distance Matrix API Integration
 * للحصول على المسافة والوقت الحقيقي
 */
export async function getDistanceFromGoogle(
  originAddress: string,
  destinationAddress: string,
  apiKey?: string
): Promise<{ distance: number; duration: string } | null> {
  if (!apiKey) {
    console.warn('Google API key not provided');
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(
      originAddress
    )}&destinations=${encodeURIComponent(destinationAddress)}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
      const element = data.rows[0].elements[0];
      const distanceInKm = element.distance.value / 1000; // تحويل من متر إلى كيلومتر
      const duration = element.duration.text;

      return {
        distance: Math.round(distanceInKm * 10) / 10,
        duration,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching distance from Google:', error);
    return null;
  }
}

/**
 * حساب رسوم التوصيل باستخدام Google Distance Matrix
 */
export async function calculateShippingWithGoogle(
  originAddress: string,
  destinationAddress: string,
  details: ShippingDetails,
  orderTotal?: number,
  apiKey?: string
): Promise<ShippingRate | null> {
  const googleData = await getDistanceFromGoogle(originAddress, destinationAddress, apiKey);

  if (!googleData) {
    // Fallback to Haversine calculation
    return null;
  }

  // حساب الرسوم بناءً على المسافة من Google
  let baseRate = BASE_RATE;
  const distanceCharge = googleData.distance * RATE_PER_KM;
  const weightCharge = details.weight * RATE_PER_KG;
  
  let extraCharges = 0;
  if (details.isFragile) {
    extraCharges += FRAGILE_CHARGE;
  }

  let totalCost = baseRate + distanceCharge + weightCharge + extraCharges;

  if (details.isExpress) {
    totalCost *= EXPRESS_MULTIPLIER;
  }

  if (orderTotal && orderTotal >= FREE_SHIPPING_THRESHOLD) {
    totalCost = 0;
  }

  return {
    distance: googleData.distance,
    baseRate,
    weightCharge,
    extraCharges,
    totalCost: Math.round(totalCost * 100) / 100,
    estimatedTime: googleData.duration,
    carrier: 'بوابتي - خدمة التوصيل',
  };
}

/**
 * الحصول على تقدير سريع لرسوم التوصيل
 */
export function getQuickEstimate(distance: number, weight: number): number {
  const baseCost = BASE_RATE + distance * RATE_PER_KM + weight * RATE_PER_KG;
  return Math.round(baseCost * 100) / 100;
}

/**
 * التحقق من أهلية التوصيل المجاني
 */
export function isEligibleForFreeShipping(orderTotal: number): boolean {
  return orderTotal >= FREE_SHIPPING_THRESHOLD;
}

/**
 * حساب المبلغ المتبقي للحصول على توصيل مجاني
 */
export function getRemainingForFreeShipping(orderTotal: number): number {
  const remaining = FREE_SHIPPING_THRESHOLD - orderTotal;
  return remaining > 0 ? Math.round(remaining * 100) / 100 : 0;
}

/**
 * الحصول على مناطق التوصيل المتاحة
 */
export function getAvailableDeliveryZones(): {
  name: string;
  cities: string[];
  baseRate: number;
  estimatedDays: string;
}[] {
  return [
    {
      name: 'عمان والمحيط',
      cities: ['عمان', 'الزرقاء', 'السلط', 'مادبا', 'الفحيص'],
      baseRate: 2.5,
      estimatedDays: '1-2 يوم',
    },
    {
      name: 'شمال الأردن',
      cities: ['إربد', 'عجلون', 'جرش', 'المفرق'],
      baseRate: 4.0,
      estimatedDays: '2-3 أيام',
    },
    {
      name: 'جنوب الأردن',
      cities: ['الكرك', 'الطفيلة', 'معان', 'العقبة'],
      baseRate: 5.0,
      estimatedDays: '3-4 أيام',
    },
  ];
}
