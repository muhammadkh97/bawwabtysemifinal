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
      console.error('خطأ في تهيئة المصادقة:', error);
      resetAuthState();
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async (uid: string, retryCount = 0): Promise<void> => {
    try {
      console.log('🔍 [AuthContext] جلب بيانات المستخدم لـ:', uid);
      
      // إعداد timeout 3 ثواني
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout fetching user data')), 3000)
      );

      const fetchPromise = supabase
        .from('users')
        .select('role, user_role, full_name, name')
        .eq('id', uid)
        .single();

      const { data, error } = await Promise.race([
        fetchPromise,
        timeoutPromise as any
      ]);

      if (error) {
        console.error('❌ [AuthContext] خطأ في جلب البيانات:', error);
        
        // إعادة المحاولة مرة واحدة في حالة الفشل
        if (retryCount < 1) {
          console.log('🔄 [AuthContext] إعادة المحاولة...');
          await new Promise(resolve => setTimeout(resolve, 500));
          return await fetchUserData(uid, retryCount + 1);
        }
        
        throw error;
      }

      console.log('📊 [AuthContext] البيانات المسترجعة:', data);
      
      // استخدام role أو user_role (كلاهما يجب أن يكون متزامنين بواسطة triggers)
      const userRoleValue = data?.role || data?.user_role || 'customer';
      const fullName = data?.full_name || data?.name || null;
      
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
      console.error('خطأ في تسجيل الخروج:', error);
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
