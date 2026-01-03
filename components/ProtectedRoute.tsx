'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('🔐 [ProtectedRoute] بدء التحقق من الصلاحيات...');
      
      // التحقق من Session أولاً
      const { data: { session } } = await supabase.auth.getSession();
      console.log('📋 [ProtectedRoute] Session:', session ? 'موجودة ✅' : 'غير موجودة ❌');
      
      if (!session) {
        console.log('❌ [ProtectedRoute] لا توجد Session - التوجيه لتسجيل الدخول');
        router.push(`${redirectTo}?redirect=${window.location.pathname}`);
        setIsLoading(false);
        return;
      }

      // جلب الدور مباشرة من public.users
      console.log('🔍 [ProtectedRoute] جلب الدور من public.users...');
      console.log('👤 [ProtectedRoute] User ID:', session.user.id);
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, user_role')
        .eq('id', session.user.id)
        .single<DbUser>();

      console.log('📊 [ProtectedRoute] بيانات المستخدم:', userData);
      console.log('⚠️ [ProtectedRoute] خطأ (إن وجد):', userError);

      let userRole = 'customer';

      if (userError || !userData) {
        console.log('❌ [ProtectedRoute] لا يمكن جلب بيانات المستخدم - استخدام الافتراضي customer');
        userRole = 'customer';
      } else {
        // استخدام role أولاً، ثم user_role كبديل
        userRole = userData.role || userData.user_role || 'customer';
        console.log('✅ [ProtectedRoute] تم الحصول على الدور:', userRole);
      }

      console.log('🎭 [ProtectedRoute] دور المستخدم النهائي:', userRole);
      console.log('🔒 [ProtectedRoute] الأدوار المسموحة:', allowedRoles);

      if (!allowedRoles.includes(userRole)) {
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
        router.push(redirectPath);
        setIsLoading(false);
        return;
      }

      console.log('✅ [ProtectedRoute] مصرح بالدخول!');
      setIsAuthorized(true);
      setIsLoading(false);
    } catch (err) {
      console.error('❌ [ProtectedRoute] خطأ غير متوقع:', err);
      router.push(redirectTo);
      setIsLoading(false);
    }
  };

  if (isLoading) {
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
