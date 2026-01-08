'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  userId: string | null;
  userRole: string | null;
  userFullName: string | null;
  loading: boolean;
  isVendorStaff: boolean;
  isRestaurantStaff: boolean;
  staffVendorId: string | null;
  staffRestaurantId: string | null;
  staffPermissions: string[];
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
  const [isVendorStaff, setIsVendorStaff] = useState(false);
  const [isRestaurantStaff, setIsRestaurantStaff] = useState(false);
  const [staffVendorId, setStaffVendorId] = useState<string | null>(null);
  const [staffRestaurantId, setStaffRestaurantId] = useState<string | null>(null);
  const [staffPermissions, setStaffPermissions] = useState<string[]>([]);
  
  // ✅ استخدام useRef بدلاً من useState لتجنب re-renders
  const lastFetchTimeRef = useRef<number>(0);
  const isInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    // Initial auth check
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      
      // تجاهل أحداث معينة لتجنب الحلقات اللانهائية
      if (event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setUser(session.user);
          setUserId(session.user.id);
        }
        return;
      }

      // فحص الوقت منذ آخر جلب (منع الجلب المتكرر خلال 60 ثانية)
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTimeRef.current;
      
      if (session?.user) {
        setUser(session.user);
        setUserId(session.user.id);
        
        // جلب البيانات فقط إذا:
        // 1. أول مرة (!isInitializedRef.current)
        // 2. مر أكثر من 60 ثانية على آخر جلب
        // 3. الحدث هو SIGNED_IN
        if (!isInitializedRef.current || timeSinceLastFetch > 60000 || event === 'SIGNED_IN') {
          setLoading(true);
          await fetchUserData(session.user.id);
          lastFetchTimeRef.current = now;
          isInitializedRef.current = true;
        } else {
        }
      } else {
        resetAuthState();
        isInitializedRef.current = false;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // ✅ dependency array فارغة - لا re-renders

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
    }
    // ✅ تم نقل setLoading(false) إلى fetchUserData ليتم تنفيذه بعد انتهاء جلب البيانات
  };

  const fetchUserData = async (uid: string, retryCount = 0): Promise<void> => {
    try {
      
      // استخدام دالة get_current_user الآمنة بدلاً من الاستعلام المباشر
      const { data, error } = await supabase
        .rpc('get_current_user')
        .single();

      if (error) {
        console.error('❌ [AuthContext] خطأ في جلب البيانات من get_current_user:', error);
        
        // محاولة بديلة: جلب مباشر من الجدول

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
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            return await fetchUserData(uid, retryCount + 1);
          }
          
          throw directError;
        }

        // استخدام البيانات المباشرة
        const userRoleValue = directData?.role || directData?.user_role || 'customer';
        const fullName = directData?.full_name || directData?.name || null;
        
        
        setUserRole(userRoleValue);
        setUserFullName(fullName);
        setLoading(false); // ✅ إضافة setLoading(false) هنا
        return;
      }

      // نوع بيانات الدالة rpc غير معرف افتراضيًا، نستخدم assertion
      const userData = data as { 
        role?: string; 
        full_name?: string;
        is_vendor_staff?: boolean;
        is_restaurant_staff?: boolean;
        staff_vendor_id?: string;
        staff_restaurant_id?: string;
        staff_permissions?: any;
      };
      
      // إذا كان المستخدم مساعد، نحتفظ بدوره الأصلي (customer) ولكن نضيف معلومات المساعد
      let userRoleValue = userData?.role || 'customer';
      
      if (userData?.is_vendor_staff) {
        // نبقي الدور كـ customer ولكن نضبط متغيرات المساعد
        setIsVendorStaff(true);
        setStaffVendorId(userData?.staff_vendor_id || null);
        setStaffPermissions(userData?.staff_permissions || []);
      } else if (userData?.is_restaurant_staff) {
        setIsRestaurantStaff(true);
        setStaffRestaurantId(userData?.staff_restaurant_id || null);
        setStaffPermissions(userData?.staff_permissions || []);
      } else {
        // ليس مساعد، إعادة تعيين متغيرات المساعد
        setIsVendorStaff(false);
        setIsRestaurantStaff(false);
        setStaffVendorId(null);
        setStaffRestaurantId(null);
        setStaffPermissions([]);
      }
      
      const fullName = userData?.full_name || null;
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
    setIsVendorStaff(false);
    setIsRestaurantStaff(false);
    setStaffVendorId(null);
    setStaffRestaurantId(null);
    setStaffPermissions([]);
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
        isVendorStaff,
        isRestaurantStaff,
        staffVendorId,
        staffRestaurantId,
        staffPermissions,
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
