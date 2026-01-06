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
    const now = Date.now();
    const timeSinceLastCheck = now - lastCheckTimeRef.current;
    
    // تحقق فقط إذا:
    // 1. لم يتم التحقق من قبل
    // 2. AuthContext انتهى من التحميل
    // 3. مر أكثر من 5 ثواني على آخر تحقق
    if (!hasCheckedRef.current && !contextLoading) {
      console.log('🔐 [ProtectedRoute] إجراء التحقق الأول...');
      checkAuth();
      hasCheckedRef.current = true;
      lastCheckTimeRef.current = now;
    } else if (hasCheckedRef.current && !contextLoading && timeSinceLastCheck > 5000) {
      // إعادة التحقق فقط إذا تغير الدور
      const prevRole = sessionStorage.getItem('lastCheckedRole');
      if (prevRole !== contextUserRole) {
        console.log('🔄 [ProtectedRoute] الدور تغير - إعادة التحقق');
        checkAuth();
        lastCheckTimeRef.current = now;
      }
    }
  }, [contextLoading, contextUserRole]);

  const checkAuth = async () => {
    try {
      console.log('🔐 [ProtectedRoute] بدء التحقق من الصلاحيات...');
      
      // انتظار تحميل AuthContext أولاً
      if (contextLoading) {
        console.log('⏳ [ProtectedRoute] انتظار AuthContext...');
        return;
      }

      // التحقق من Session أولاً
      const { data: { session } } = await supabase.auth.getSession();
      console.log('📋 [ProtectedRoute] Session:', session ? 'موجودة ✅' : 'غير موجودة ❌');
      
      if (!session) {
        console.log('❌ [ProtectedRoute] لا توجد Session - التوجيه لتسجيل الدخول');
        setIsLoading(false);
        router.push(`${redirectTo}?redirect=${window.location.pathname}`);
        return;
      }

      let userRole = contextUserRole || 'customer';

      // حفظ الدور في sessionStorage للمقارنة لاحقاً
      sessionStorage.setItem('lastCheckedRole', userRole);

      console.log('🎭 [ProtectedRoute] دور المستخدم النهائي:', userRole);
      console.log('🔒 [ProtectedRoute] الأدوار المسموحة:', allowedRoles);
      console.log('👥 [ProtectedRoute] هل هو مساعد بائع؟', isVendorStaff);
      console.log('🍽️ [ProtectedRoute] هل هو مساعد مطعم؟', isRestaurantStaff);

      // التحقق من الصلاحيات
      const isRoleAllowed = allowedRoles.includes(userRole);
      const isStaffAccessingVendorDashboard = isVendorStaff && allowedRoles.includes('vendor');
      const isStaffAccessingRestaurantDashboard = isRestaurantStaff && allowedRoles.includes('restaurant');

      const hasAccess = isRoleAllowed || isStaffAccessingVendorDashboard || isStaffAccessingRestaurantDashboard;

      if (!hasAccess) {
        console.log('❌ [ProtectedRoute] الدور غير مسموح - التوجيه للوحة التحكم الصحيحة');
        console.log(`   المطلوب: ${allowedRoles.join(', ')}`);
        console.log(`   الموجود: ${userRole}`);
        
        // إعادة التوجيه إلى لوحة التحكم الصحيحة حسب دور المستخدم
        const roleRedirects: { [key: string]: string } = {
          'admin': '/dashboard/admin',
          'vendor': '/dashboard/vendor',
          'restaurant': '/dashboard/restaurant',
          'driver': '/dashboard/driver',
          'customer': '/'
        };
        
        const redirectPath = roleRedirects[userRole] || '/';
        console.log(`🔄 [ProtectedRoute] إعادة التوجيه إلى: ${redirectPath}`);
        setIsLoading(false);
        router.push(redirectPath);
        return;
      }

      console.log('✅ [ProtectedRoute] مصرح بالدخول!');
      setIsAuthorized(true);
      setIsLoading(false);
    } catch (err) {
      console.error('❌ [ProtectedRoute] خطأ غير متوقع:', err);
      setIsLoading(false);
      router.push(redirectTo);
    }
  };

  if (isLoading || contextLoading) {
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
