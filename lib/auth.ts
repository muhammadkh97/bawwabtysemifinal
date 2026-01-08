import { supabase } from './supabase'
import type { AuthChangeEvent, Session, User, AuthError } from '@supabase/supabase-js'

// ============================================
// TYPE DEFINITIONS
// ============================================

type DbUser = {
  id?: string
  email?: string | null
  full_name?: string | null
  user_role?: string | null
  role?: string | null
}

const toDbUser = (data: unknown): DbUser | null => (data && typeof data === 'object' ? (data as DbUser) : null)

const resolveRole = (data: unknown) => {
  const user = toDbUser(data)
  return user?.role || user?.user_role || 'customer'
}

const ensureUserObject = (data: unknown): DbUser => toDbUser(data) || ({} as DbUser)

// User profile update interface
interface UserProfileUpdate {
  full_name?: string
  phone?: string
  avatar_url?: string
  address?: string
  preferred_currency?: string
  language?: string
}

// Extended User type with custom properties
interface ExtendedUser extends User {
  role?: string
  full_name?: string
  user_role?: string
  [key: string]: unknown
}

// Auth response interfaces
interface AuthResponse {
  user: ExtendedUser | null
  error: string | null
}

interface DataResponse<T = unknown> {
  data: T | null
  error: string | null
}

// Error helper function
function getAuthErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as AuthError).message)
  }
  return 'حدث خطأ غير متوقع'
}

// ============================================
// AUTH FUNCTIONS - FIXED VERSION
// ============================================

/**
 * تسجيل مستخدم جديد
 */
export async function signUp(
  email: string,
  password: string,
  userData: {
    name: string
    phone?: string
    role: string
    // حقول إضافية للبائع
    store_name?: string
    business_type?: string
    identity_image_url?: string
    // حقول إضافية للمندوب
    vehicle_type?: string
    vehicle_plate_number?: string
    driver_license_url?: string
    vehicle_license_url?: string
  }
) {
  try {
    // إنشاء حساب في Supabase Auth مع البيانات في metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userData.name,
          phone: userData.phone,
          role: userData.role,
          store_name: userData.store_name,
          business_type: userData.business_type,
          identity_image_url: userData.identity_image_url,
          vehicle_type: userData.vehicle_type,
          vehicle_plate_number: userData.vehicle_plate_number,
          driver_license_url: userData.driver_license_url,
          vehicle_license_url: userData.vehicle_license_url,
        },
      },
    })

    if (authError) {
      console.error('Auth error:', authError)
      return { user: null, error: authError.message }
    }

    // الـ Trigger في قاعدة البيانات سيقوم بإنشاء السجل في public.users تلقائياً
    // لا حاجة لإنشائه يدوياً

    return { user: authData.user, error: null }
  } catch (error: unknown) {
    console.error('SignUp error:', getAuthErrorMessage(error))
    return { user: null, error: getAuthErrorMessage(error) }
  }
}

/**
 * تسجيل الدخول - FIXED
 */
export async function signIn(email: string, password: string) {
  try {
    
    // تسجيل الدخول في Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      console.error('❌ خطأ في المصادقة:', authError);
      return { user: null, error: authError.message }
    }

    if (!authData.user) {
      console.error('❌ لا توجد بيانات مستخدم في الاستجابة');
      return { user: null, error: 'فشل تسجيل الدخول' }
    }


    // التحقق من Session
    if (!authData.session) {
      console.warn('⚠️ تحذير: لم يتم إنشاء Session');
    } else {
    }

    // جلب بيانات المستخدم من public.users باستخدام دالة آمنة
    const { data: userData, error: userError } = await supabase
      .rpc('get_current_user')
      .single<DbUser>()

    if (userError) {
      console.warn('⚠️ تحذير: لم يتم جلب بيانات المستخدم من public.users:', userError);
      
      // محاولة جلب مباشرة من الجدول كخطة بديلة
      const { data: directData } = await supabase
        .from('users')
        .select('id, email, full_name, user_role')
        .eq('id', authData.user.id)
        .single();

      const user: ExtendedUser = {
        ...authData.user,
        id: authData.user.id,
        email: authData.user.email,
        role: directData?.user_role || authData.user.user_metadata?.role || 'customer',
        name: directData?.full_name || authData.user.user_metadata?.name || authData.user.email?.split('@')[0],
      };
      return { 
        user, 
        error: null 
      }
    }


    // دمج بيانات auth مع بيانات public.users
    const safeUserData = ensureUserObject(userData)

    const user: ExtendedUser = {
      ...authData.user,
      id: authData.user.id,
      email: authData.user.email,
      ...safeUserData,
      role: resolveRole(userData)
    };
    
    return { 
      user, 
      error: null 
    }
  } catch (error: unknown) {
    console.error('❌ خطأ غير متوقع في signIn:', getAuthErrorMessage(error));
    return { user: null, error: getAuthErrorMessage(error) }
  }
}

/**
 * تسجيل الخروج
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('SignOut error:', error)
      return { error: error.message }
    }
    return { error: null }
  } catch (error: unknown) {
    console.error('SignOut error:', getAuthErrorMessage(error))
    return { error: getAuthErrorMessage(error) }
  }
}

/**
 * الحصول على المستخدم الحالي - FIXED
 */
export async function getCurrentUser(): Promise<AuthResponse> {
  try {
    // الحصول على بيانات المستخدم من Supabase Auth
    // في Supabase v2.45، لا توجد طريقة مباشرة getUser، نستخدم onAuthStateChange
    return new Promise((resolve) => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
        subscription.unsubscribe();
        
        if (!session?.user) {
          resolve({ user: null, error: 'لم يتم تسجيل الدخول' });
          return;
        }
        
        const user = session.user;

        // جلب بيانات المستخدم من public.users باستخدام دالة آمنة
        const { data: userData, error: userError } = await supabase
          .rpc('get_current_user')
          .single<DbUser>()

        if (userError) {
          console.warn('Warning: Could not fetch user data:', userError)
          
          // محاولة جلب مباشرة
          const { data: directData } = await supabase
            .from('users')
            .select('id, email, full_name, user_role')
            .eq('id', user.id)
            .single();

          resolve({ 
            user: {
              ...user,
              role: directData?.user_role || 'customer',
              full_name: directData?.full_name
            } as ExtendedUser, 
            error: null 
          });
          return;
        }

        resolve({ 
          user: {
            ...user,
            ...ensureUserObject(userData),
            role: resolveRole(userData)
          } as ExtendedUser, 
          error: null 
        });
      });
    });
  } catch (error: unknown) {
    console.error('GetCurrentUser error:', getAuthErrorMessage(error))
    return { user: null, error: getAuthErrorMessage(error) }
  }
}

/**
 * الحصول على بيانات المستخدم بشكل آمن - FIXED
 */
export async function getUserData(userId: string) {
  try {
    // استخدام دالة get_current_user من قاعدة البيانات
    // هذه الدالة تستخدم SECURITY DEFINER لتجاوز RLS
    const { data, error } = await supabase
      .rpc('get_current_user')
      .single()

    if (error) {
      console.error('Error fetching user data:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getUserData:', error)
    return null
  }
}

/**
 * التحقق من صلاحية المستخدم
 */
export async function checkUserRole(requiredRole: string | string[]) {
  const { user } = await getCurrentUser()
  
  if (!user || !user.role) return false
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(user.role)
  }
  
  return user.role === requiredRole
}

/**
 * تحديث ملف المستخدم
 */
export async function updateUserProfile(
  userId: string, 
  updates: UserProfileUpdate
): Promise<DataResponse> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Update profile error:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: unknown) {
    console.error('Update profile error:', getAuthErrorMessage(error))
    return { data: null, error: getAuthErrorMessage(error) }
  }
}

/**
 * تغيير كلمة المرور
 */
export async function changePassword(newPassword: string) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      console.error('Change password error:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: unknown) {
    console.error('Change password error:', getAuthErrorMessage(error))
    return { data: null, error: getAuthErrorMessage(error) }
  }
}

/**
 * إعادة تعيين كلمة المرور
 */
export async function resetPassword(email: string) {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/reset-password`,
    })

    if (error) {
      console.error('Reset password error:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: unknown) {
    console.error('Reset password error:', getAuthErrorMessage(error))
    return { data: null, error: getAuthErrorMessage(error) }
  }
}

/**
 * تسجيل الدخول باستخدام OAuth (Google, Facebook, Apple)
 */
export async function signInWithOAuth(provider: 'google' | 'facebook' | 'apple') {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
      },
    })

    if (error) {
      console.error('OAuth error:', error)
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: unknown) {
    console.error('OAuth error:', getAuthErrorMessage(error))
    return { data: null, error: getAuthErrorMessage(error) }
  }
}

/**
 * تسجيل الدخول باستخدام Google
 */
export async function signInWithGoogle() {
  return signInWithOAuth('google')
}

/**
 * تسجيل الدخول باستخدام Facebook
 */
export async function signInWithFacebook() {
  return signInWithOAuth('facebook')
}

/**
 * تسجيل الدخول باستخدام Apple
 */
export async function signInWithApple() {
  return signInWithOAuth('apple')
}
