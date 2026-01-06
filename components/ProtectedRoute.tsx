'use client';

import { useEffect, useState } from 'react';
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
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // تحقق فقط مرة واحدة عند التحميل الأول أو عند تغيير الدور
    if (!hasChecked || !contextLoading) {
      checkAuth();
    }
  }, [contextUserRole, contextLoading, isVendorStaff, isRestaurantStaff]);

  const checkAuth = async () => {
    try {
      console.log('🔐 [ProtectedRoute] بدء التحقق من الصلاحيات...');
      
      // منع التحقق المتكرر
      if (hasChecked && !contextLoading && contextUserRole) {
        console.log('⏭️ [ProtectedRoute] تم التحقق مسبقاً - تخطي');
        
        // تحقق سريع من الصلاحيات فقط
        const isRoleAllowed = allowedRoles.includes(contextUserRole);
        const isStaffAccessingVendorDashboard = isVendorStaff && allowedRoles.includes('vendor');
        const isStaffAccessingRestaurantDashboard = isRestaurantStaff && allowedRoles.includes('restaurant');
        const hasAccess = isRoleAllowed || isStaffAccessingVendorDashboard || isStaffAccessingRestaurantDashboard;
        
        if (hasAccess) {
          setIsAuthorized(true);
          setIsLoading(false);
        }
        return;
      }
      
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
        setHasChecked(true);
        router.push(`${redirectTo}?redirect=${window.location.pathname}`);
        return;
      }

      let userRole = 'customer';

      // محاولة استخدام الدور من AuthContext أولاً
      if (contextUserRole) {
        console.log('✅ [ProtectedRoute] استخدام الدور من AuthContext:', contextUserRole);
        userRole = contextUserRole;
      } else {
        // إذا لم يكن متاحاً، جلبه مباشرة مع timeout محسّن
        console.log('🔍 [ProtectedRoute] جلب الدور من public.users...');
        console.log('👤 [ProtectedRoute] User ID:', session.user.id);
        
        try {
          // timeout 10 ثواني
          const timeoutDuration = 10000;
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), timeoutDuration)
          );

          const fetchPromise = supabase
            .from('users')
            .select('role, user_role')
            .eq('id', session.user.id)
            .single<DbUser>();

          const { data: userData, error: userError } = await Promise.race([
            fetchPromise,
            timeoutPromise as any
          ]);

          console.log('📊 [ProtectedRoute] بيانات المستخدم:', userData);
          console.log('⚠️ [ProtectedRoute] خطأ (إن وجد):', userError);

          if (userError || !userData) {
            console.log('❌ [ProtectedRoute] لا يمكن جلب بيانات المستخدم - استخدام الافتراضي customer');
            userRole = 'customer';
          } else {
            // استخدام role أولاً، ثم user_role كبديل
            userRole = userData.role || userData.user_role || 'customer';
            console.log('✅ [ProtectedRoute] تم الحصول على الدور:', userRole);
          }
        } catch (queryError) {
          console.error('❌ [ProtectedRoute] خطأ في الـ query أو timeout:', queryError);
          // في حالة الخطأ، نفترض الدور customer للسماح بالعودة للصفحة الرئيسية
          userRole = 'customer';
        }
      }

      console.log('🎭 [ProtectedRoute] دور المستخدم النهائي:', userRole);
      console.log('🔒 [ProtectedRoute] الأدوار المسموحة:', allowedRoles);
      console.log('👥 [ProtectedRoute] هل هو مساعد بائع؟', isVendorStaff);
      console.log('🍽️ [ProtectedRoute] هل هو مساعد مطعم؟', isRestaurantStaff);

      // التحقق من الصلاحيات: إما الدور مسموح به، أو هو مساعد يحاول دخول لوحة التحكم المناسبة
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
        setHasChecked(true);
        router.push(redirectPath);
        return;
      }

      console.log('✅ [ProtectedRoute] مصرح بالدخول!');
      setIsAuthorized(true);
      setIsLoading(false);
      setHasChecked(true);
    } catch (err) {
      console.error('❌ [ProtectedRoute] خطأ غير متوقع:', err);
      setIsLoading(false);
      setHasChecked(true);
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
