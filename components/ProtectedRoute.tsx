'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type DbUser = {
  role?: string | null;
  user_role?: string | null;
};

const resolveRole = (data?: DbUser | null) => data?.role || data?.user_role || 'customer';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles,
  redirectTo = '/auth/login'
}: ProtectedRouteProps) {
  const router = useRouter();
  const { 
    userRole: contextUserRole, 
    loading: contextLoading, 
    isVendorStaff, 
    isRestaurantStaff 
  } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // ✅ استخدام useRef لتجنب re-checks غير ضرورية
  const hasCheckedRef = useRef(false);
  const lastCheckTimeRef = useRef<number>(0);

  useEffect(() => {
    // ✅ إذا كان AuthContext لا يزال يحمل، انتظر
    if (contextLoading) {
      return;
    }

    const now = Date.now();
    const timeSinceLastCheck = now - lastCheckTimeRef.current;
    
    // تحقق فقط إذا:
    // 1. لم يتم التحقق من قبل
    // 2. AuthContext انتهى من التحميل
    if (!hasCheckedRef.current) {
      checkAuth();
      hasCheckedRef.current = true;
      lastCheckTimeRef.current = now;
    } else if (timeSinceLastCheck > 5000) {
      // إعادة التحقق فقط إذا تغير الدور
      const prevRole = sessionStorage.getItem('lastCheckedRole');
      if (prevRole !== contextUserRole) {
        checkAuth();
        lastCheckTimeRef.current = now;
      }
    }
  }, [contextLoading, contextUserRole]);

  const checkAuth = async () => {
    try {

      // التحقق من Session أولاً
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsLoading(false);
        router.push(`${redirectTo}?redirect=${window.location.pathname}`);
        return;
      }

      let userRole = contextUserRole || 'customer';

      // حفظ الدور في sessionStorage للمقارنة لاحقاً
      sessionStorage.setItem('lastCheckedRole', userRole);


      // التحقق من الصلاحيات
      const isRoleAllowed = allowedRoles.includes(userRole);
      const isStaffAccessingVendorDashboard = isVendorStaff && allowedRoles.includes('vendor');
      const isStaffAccessingRestaurantDashboard = isRestaurantStaff && allowedRoles.includes('restaurant');

      const hasAccess = isRoleAllowed || isStaffAccessingVendorDashboard || isStaffAccessingRestaurantDashboard;

      if (!hasAccess) {
        
        // إعادة التوجيه إلى لوحة التحكم الصحيحة حسب دور المستخدم
        const roleRedirects: { [key: string]: string } = {
          'admin': '/dashboard/admin',
          'vendor': '/dashboard/vendor',
          'restaurant': '/dashboard/restaurant',
          'driver': '/dashboard/driver',
          'customer': '/'
        };
        
        const redirectPath = roleRedirects[userRole] || '/';
        setIsLoading(false);
        router.push(redirectPath);
        return;
      }

      setIsAuthorized(true);
      setIsLoading(false);
    } catch (err) {
      console.error('❌ [ProtectedRoute] خطأ غير متوقع:', err);
      setIsLoading(false);
      router.push(redirectTo);
    }
  };

  // ✅ عرض شاشة التحميل فقط في المرة الأولى
  if ((isLoading && !hasCheckedRef.current) || contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-pink-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
