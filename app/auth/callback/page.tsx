'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('خطأ في استرجاع الجلسة:', error);
          router.push('/auth/login?error=auth_failed');
          return;
        }

        if (session?.user) {
          // التحقق من وجود المستخدم في قاعدة البيانات
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userError || !userData) {
            // إنشاء سجل المستخدم إذا لم يكن موجوداً
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'مستخدم',
                role: 'customer',
                created_at: new Date().toISOString(),
              });

            if (insertError) {
              console.error('خطأ في إنشاء سجل المستخدم:', insertError);
            }
          }

          // توجيه المستخدم حسب دوره
          const role = userData?.role || 'customer';
          
          switch (role) {
            case 'admin':
              router.push('/dashboard/admin');
              break;
            case 'vendor':
              router.push('/dashboard/vendor');
              break;
            case 'driver':
              router.push('/dashboard/driver');
              break;
            default:
              router.push('/');
          }
        } else {
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('خطأ في معالجة callback:', error);
        router.push('/auth/login?error=unexpected');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0A0515 0%, #1a0b2e 50%, #2d1b4e 100%)' }}>
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-white text-lg">جاري تسجيل الدخول...</p>
      </div>
    </div>
  );
}
