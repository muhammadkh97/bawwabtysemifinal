import { supabase } from './supabase'
import type { AuthChangeEvent, Session, User, AuthError } from '@supabase/supabase-js'

// ============================================
// TYPE DEFINITIONS
// ============================================

export type UserRole = 'customer' | 'vendor' | 'driver' | 'admin' | 'restaurant';

export interface DbUser {
  id: string
  email: string | null
  full_name: string | null
  name?: string | null
  phone?: string | null
  role: UserRole
  user_role?: string | null
  avatar_url?: string | null
  is_active?: boolean
  vendor_id?: string | null
  loyalty_points?: number
  created_at?: string
  updated_at?: string
  total_earned_points?: number
  referral_code?: string | null
  date_of_birth?: string | null
  gender?: 'male' | 'female' | null
  country?: string | null
  preferred_currency?: string
}

const toDbUser = (data: unknown): DbUser | null => {
  if (data && typeof data === 'object' && 'id' in data && 'role' in data) {
    return data as DbUser;
  }
  return null;
}

const resolveRole = (data: unknown): UserRole => {
  const user = data as DbUser | null;
  const role = user?.role || (user?.user_role as UserRole) || 'customer';
  return role as UserRole;
}

const ensureUserObject = (data: unknown): DbUser => {
  const user = toDbUser(data);
  if (user) return user;
  return {
    id: '',
    email: '',
    full_name: '',
    role: 'customer'
  };
}

// User profile update interface
export interface UserProfileUpdate {
  full_name?: string
  phone?: string
  avatar_url?: string
  address?: string
  preferred_currency?: string
  language?: string
}

// Extended User type with custom properties
export interface ExtendedUser extends User {
  role: UserRole
  full_name?: string | null
  user_role?: string | null
  name?: string | null
}

// Auth response interfaces
export interface AuthResponse {
  user: ExtendedUser | null
  error: string | null
}

export interface DataResponse<T = unknown> {
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
    role: UserRole
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
): Promise<AuthResponse> {
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

    if (!authData.user) {
        return { user: null, error: 'فشل إنشاء الحساب' }
    }

    const extendedUser: ExtendedUser = {
        ...authData.user,
        role: userData.role,
        full_name: userData.name
    };

    return { user: extendedUser, error: null }
  } catch (error: unknown) {
    console.error('SignUp error:', getAuthErrorMessage(error))
    return { user: null, error: getAuthErrorMessage(error) }
  }
}

/**
 * تسجيل الدخول - FIXED
 */
export async function signIn(email: string, password: string): Promise<AuthResponse> {
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

    // جلب بيانات المستخدم من public.users باستخدام دالة آمنة
    const { data: userData, error: userError } = await supabase
      .rpc('get_current_user')
      .single<DbUser>()

    if (userError) {
      // Silent fallback to direct fetch
      
      // محاولة جلب مباشرة من الجدول كخطة بديلة
      const { data: directData } = await supabase
        .from('users')
        .select('id, email, full_name, role::text as role')
        .eq('id', authData.user.id)
        .single();

      const user: ExtendedUser = {
        ...authData.user,
        id: authData.user.id,
        email: authData.user.email,
        role: (directData?.role as UserRole) || (authData.user.user_metadata?.role as UserRole) || 'customer',
        full_name: directData?.full_name || authData.user.user_metadata?.name || authData.user.email?.split('@')[0],
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
      role: resolveRole(userData),
      full_name: safeUserData.full_name,
      user_role: safeUserData.user_role || null,
      name: safeUserData.name || null
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
export async function signOut(): Promise<{ error: string | null }> {
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
    return new Promise((resolve) => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
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
          // Silent fallback to direct fetch
          
          // محاولة جلب مباشرة
          const { data: directData } = await supabase
            .from('users')
            .select('id, email, full_name, role::text as role')
            .eq('id', user.id)
            .single();

          resolve({ 
            user: {
              ...user,
              role: (directData?.role as UserRole) || 'customer',
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
export async function getUserData(userId: string): Promise<DbUser | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_current_user')
      .single<DbUser>()

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
export async function checkUserRole(requiredRole: UserRole | UserRole[]): Promise<boolean> {
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
): Promise<DataResponse<DbUser>> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single<DbUser>()

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
export async function changePassword(newPassword: string): Promise<DataResponse<User>> {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      console.error('Change password error:', error)
      return { data: null, error: error.message }
    }
    
    return { data: data.user, error: null }
  } catch (error: unknown) {
    console.error('Change password error:', getAuthErrorMessage(error))
    return { data: null, error: getAuthErrorMessage(error) }
  }
}

/**
 * إعادة تعيين كلمة المرور
 */
export async function resetPassword(email: string): Promise<DataResponse<unknown>> {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${typeof window !== 'undefined' ? (typeof window !== 'undefined' ? window.location.origin : undefined) : ''}/auth/reset-password`,
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
export async function signInWithOAuth(provider: 'google' | 'facebook' | 'apple'): Promise<DataResponse<unknown>> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${typeof window !== 'undefined' ? (typeof window !== 'undefined' ? window.location.origin : undefined) : ''}/auth/callback`,
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
export async function signInWithGoogle(): Promise<DataResponse<unknown>> {
  return signInWithOAuth('google')
}

/**
 * تسجيل الدخول باستخدام Facebook
 */
export async function signInWithFacebook(): Promise<DataResponse<unknown>> {
  return signInWithOAuth('facebook')
}

/**
 * تسجيل الدخول باستخدام Apple
 */
export async function signInWithApple(): Promise<DataResponse<unknown>> {
  return signInWithOAuth('apple')
}
