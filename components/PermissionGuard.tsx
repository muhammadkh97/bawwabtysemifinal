'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission, hasAnyPermission } from '@/lib/permissions';
import { AlertTriangle } from 'lucide-react';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredPermissions?: string[];
  requireAll?: boolean; // إذا كان true، يجب توفر جميع الصلاحيات
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * مكون لحماية المحتوى بناءً على الصلاحيات
 * يستخدم للمساعدين فقط - البائع الأصلي يمر مباشرة
 */
export default function PermissionGuard({
  children,
  requiredPermission,
  requiredPermissions,
  requireAll = false,
  fallback,
  redirectTo,
}: PermissionGuardProps) {
  const router = useRouter();
  const { isVendorStaff, isRestaurantStaff, staffPermissions } = useAuth();

  // إذا لم يكن مساعد، اسمح بالمرور
  const isStaff = isVendorStaff || isRestaurantStaff;
  if (!isStaff) {
    return <>{children}</>;
  }

  // التحقق من الصلاحية الواحدة
  if (requiredPermission) {
    const hasAccess = hasPermission(staffPermissions, requiredPermission as any);
    
    if (!hasAccess) {
      if (redirectTo) {
        router.push(redirectTo);
        return null;
      }
      
      return fallback || <NoPermissionMessage permission={requiredPermission} />;
    }
  }

  // التحقق من قائمة صلاحيات
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAccess = requireAll
      ? requiredPermissions.every(p => hasPermission(staffPermissions, p as any))
      : hasAnyPermission(staffPermissions, requiredPermissions as any);
    
    if (!hasAccess) {
      if (redirectTo) {
        router.push(redirectTo);
        return null;
      }
      
      return fallback || <NoPermissionMessage permissions={requiredPermissions} />;
    }
  }

  return <>{children}</>;
}

/**
 * رسالة افتراضية عند عدم وجود صلاحية
 */
function NoPermissionMessage({ 
  permission, 
  permissions 
}: { 
  permission?: string; 
  permissions?: string[];
}) {
  const permissionNames: { [key: string]: string } = {
    'manage_products': 'إدارة المنتجات',
    'view_orders': 'عرض الطلبات',
    'manage_orders': 'إدارة الطلبات',
    'view_analytics': 'عرض التحليلات',
    'manage_marketing': 'إدارة التسويق',
    'manage_settings': 'إدارة الإعدادات',
    'manage_staff': 'إدارة المساعدين',
  };

  const displayPermission = permission 
    ? permissionNames[permission] || permission
    : permissions?.map(p => permissionNames[p] || p).join(' أو ');

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold text-yellow-500 mb-3">
            ⚠️ صلاحية مطلوبة
          </h2>
          <p className="text-yellow-400 text-lg mb-2">
            ليس لديك صلاحية: <strong>{displayPermission}</strong>
          </p>
          <p className="text-yellow-300/70 text-sm">
            للوصول إلى هذه الصفحة، يجب أن يمنحك صاحب المتجر الصلاحية المطلوبة.
          </p>
        </div>
      </div>
    </div>
  );
}
