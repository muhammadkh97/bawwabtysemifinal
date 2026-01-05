/**
 * ملف التحقق من صلاحيات المساعدين
 */

export type VendorPermission = 
  | 'view_orders'
  | 'manage_orders'
  | 'manage_products'
  | 'view_analytics'
  | 'manage_settings'
  | 'manage_staff';

export type RestaurantPermission = 
  | 'view_orders'
  | 'manage_orders'
  | 'manage_menu'
  | 'view_analytics'
  | 'manage_settings'
  | 'manage_staff';

/**
 * التحقق من وجود صلاحية معينة
 */
export function hasPermission(
  userPermissions: string[],
  requiredPermission: VendorPermission | RestaurantPermission
): boolean {
  return userPermissions.includes(requiredPermission);
}

/**
 * التحقق من وجود أي صلاحية من قائمة صلاحيات
 */
export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: (VendorPermission | RestaurantPermission)[]
): boolean {
  return requiredPermissions.some(permission => 
    userPermissions.includes(permission)
  );
}

/**
 * التحقق من وجود جميع الصلاحيات المطلوبة
 */
export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: (VendorPermission | RestaurantPermission)[]
): boolean {
  return requiredPermissions.every(permission => 
    userPermissions.includes(permission)
  );
}

/**
 * التحقق من أن المستخدم بائع أصلي (ليس مساعد)
 */
export function isOriginalVendor(
  userRole: string | null,
  isVendorStaff: boolean
): boolean {
  return userRole === 'vendor' && !isVendorStaff;
}

/**
 * التحقق من أن المستخدم صاحب مطعم أصلي (ليس مساعد)
 */
export function isOriginalRestaurant(
  userRole: string | null,
  isRestaurantStaff: boolean
): boolean {
  return userRole === 'restaurant' && !isRestaurantStaff;
}
