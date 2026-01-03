'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  userId: string | null;
  userRole: string | null;
  userFullName: string | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userFullName, setUserFullName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial auth check
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setUserId(session.user.id);
        fetchUserData(session.user.id);
      } else {
        resetAuthState();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const initializeAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        setUserId(session.user.id);
        await fetchUserData(session.user.id);
      } else {
        resetAuthState();
      }
    } catch (error) {
      console.error('❌ [AuthContext] خطأ في تهيئة المصادقة:', error);
      resetAuthState();
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async (uid: string, retryCount = 0): Promise<void> => {
    try {
      console.log(`🔍 [AuthContext] جلب بيانات المستخدم لـ: ${uid} (محاولة ${retryCount + 1}/3)`);
      
      // استخدام دالة get_current_user الآمنة بدلاً من الاستعلام المباشر
      const { data, error } = await supabase
        .rpc('get_current_user')
        .single();

      if (error) {
        console.error('❌ [AuthContext] خطأ في جلب البيانات من get_current_user:', error);
        
        // محاولة بديلة: جلب مباشر من الجدول
        console.log('🔄 [AuthContext] محاولة جلب مباشر من جدول users...');

        const { data: directData, error: directError } = await supabase
          .from('users')
          .select('role, user_role, full_name, name')
          .eq('id', uid)
          .single<{ role?: string; user_role?: string; full_name?: string; name?: string }>();

        if (directError) {
          console.error('❌ [AuthContext] خطأ في الجلب المباشر:', directError);
          
          // إعادة المحاولة حتى 3 مرات مع Exponential Backoff
          if (retryCount < 2) {
            const backoffDelay = Math.pow(2, retryCount) * 1000; // 1s, 2s
            console.log(`🔄 [AuthContext] إعادة المحاولة بعد ${backoffDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            return await fetchUserData(uid, retryCount + 1);
          }
          
          throw directError;
        }

        // استخدام البيانات المباشرة
        const userRoleValue = directData?.role || directData?.user_role || 'customer';
        const fullName = directData?.full_name || directData?.name || null;
        
        console.log('✅ [AuthContext] تم الجلب المباشر بنجاح');
        console.log('🎭 [AuthContext] الدور:', userRoleValue);
        console.log('👤 [AuthContext] الاسم:', fullName);
        
        setUserRole(userRoleValue);
        setUserFullName(fullName);
        return;
      }

      console.log('✅ [AuthContext] البيانات المسترجعة من get_current_user:', data);
      // نوع بيانات الدالة rpc غير معرف افتراضيًا، نستخدم assertion
      const userData = data as { role?: string; full_name?: string };
      // استخدام role من الدالة
      const userRoleValue = userData?.role || 'customer';
      const fullName = userData?.full_name || null;
      console.log('🎭 [AuthContext] الدور النهائي:', userRoleValue);
      console.log('👤 [AuthContext] الاسم:', fullName);
      setUserRole(userRoleValue);
      setUserFullName(fullName);
    } catch (error) {
      console.error('❌ [AuthContext] خطأ في جلب بيانات المستخدم بعد المحاولات:', error);
      // في حالة الفشل، نستخدم الافتراضي
      setUserRole('customer');
      setUserFullName(null);
    } finally {
      setLoading(false);
    }
  };

  const resetAuthState = () => {
    setUser(null);
    setUserId(null);
    setUserRole(null);
    setUserFullName(null);
    setLoading(false);
  };

  const refreshUser = async () => {

    setLoading(true);
    await initializeAuth();
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      resetAuthState();
    } catch (error) {
      console.error('❌ [AuthContext] خطأ في تسجيل الخروج:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userId,
        userRole,
        userFullName,
        loading,
        refreshUser,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
