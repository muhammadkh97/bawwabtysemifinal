import { supabase } from './supabase';
import { logger } from '@/lib/logger';
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
      logger.error('Auth error', { error: authError.message, component: 'signUp', email });
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
    const errorMessage = getAuthErrorMessage(error);
    logger.error('SignUp error', { error: errorMessage, component: 'signUp' });
    return { user: null, error: errorMessage }
  }
}

/**
 * تسجيل الدخول - FIXED & OPTIMIZED
 */
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    logger.debug('Attempting sign in', { email, component: 'signIn' });
    
    // تسجيل الدخول في Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      logger.error('Authentication error', { error: authError.message, component: 'signIn', email });
      return { user: null, error: authError.message }
    }

    if (!authData.user || !authData.session) {
      logger.error('No user data or session in response', { component: 'signIn' });
      return { user: null, error: 'فشل تسجيل الدخول' }
    }

    logger.debug('Signed in to Auth successfully', { component: 'signIn' });

    // الانتظار قليلاً للتأكد من حفظ الجلسة في الـ cookies
    await new Promise(resolve => setTimeout(resolve, 100));

    // جلب بيانات المستخدم من public.users باستخدام دالة آمنة
    const { data: userData, error: userError } = await supabase
      .rpc('get_current_user')
      .single<DbUser>()

    if (userError) {
      logger.warn('get_current_user error, trying direct fetch', { error: userError.message, component: 'signIn' });
      
      // محاولة جلب مباشرة من الجدول كخطة بديلة
      const { data: directData, error: directError } = await supabase
        .from('users')
        .select('id, email, full_name, role, phone, avatar_url')
        .eq('id', authData.user.id)
        .single();

      if (directError) {
        logger.error('Direct fetch also failed', { error: directError.message, component: 'signIn' });
      }

      const user: ExtendedUser = {
        ...authData.user,
        id: authData.user.id,
        email: authData.user.email,
        role: (directData?.role as UserRole) || (authData.user.user_metadata?.role as UserRole) || 'customer',
        full_name: directData?.full_name || authData.user.user_metadata?.name || authData.user.email?.split('@')[0],
      };
      
      logger.debug('Created user data from fallback', { role: user.role, component: 'signIn' });
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
    
    logger.debug('Sign in successful', { role: user.role, component: 'signIn' });
    return { 
      user, 
      error: null 
    }
  } catch (error: unknown) {
    const errorMessage = getAuthErrorMessage(error);
    logger.error('Unexpected error in signIn', { error: errorMessage, component: 'signIn' });
    return { user: null, error: errorMessage }
  }
}

/**
 * تسجيل الخروج
 */
export async function signOut(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      logger.error('SignOut error', { error: error.message, component: 'signOut' });
      return { error: error.message }
    }
    return { error: null }
  } catch (error: unknown) {
    const errorMessage = getAuthErrorMessage(error);
    logger.error('SignOut error', { error: errorMessage, component: 'signOut' });
    return { error: errorMessage }
  }
}

/**
 * الحصول على المستخدم الحالي - FIXED & OPTIMIZED
 */
export async function getCurrentUser(): Promise<AuthResponse> {
  try {
    // استخدام getUser بدلاً من onAuthStateChange للحصول على الجلسة الحالية مباشرة
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      logger.debug('No active session', { error: authError.message, component: 'getCurrentUser' });
      return { user: null, error: authError.message }
    }

    if (!user) {
      return { user: null, error: 'لم يتم تسجيل الدخول' }
    }

    logger.debug('Found active session for user', { userId: user.id, component: 'getCurrentUser' });

    // جلب بيانات المستخدم من public.users باستخدام دالة آمنة
    const { data: userData, error: userError } = await supabase
      .rpc('get_current_user')
      .single<DbUser>()

    if (userError) {
      logger.warn('get_current_user error, trying direct fetch', { error: userError.message, component: 'getCurrentUser' });
      
      // محاولة جلب مباشرة من الجدول
      const { data: directData } = await supabase
        .from('users')
        .select('id, email, full_name, role, phone, avatar_url')
        .eq('id', user.id)
        .single();

      return { 
        user: {
          ...user,
          role: (directData?.role as UserRole) || 'customer',
          full_name: directData?.full_name
        } as ExtendedUser, 
        error: null 
      };
    }

    return { 
      user: {
        ...user,
        ...ensureUserObject(userData),
        role: resolveRole(userData)
      } as ExtendedUser, 
      error: null 
    };
  } catch (error: unknown) {
    const errorMessage = getAuthErrorMessage(error);
    logger.error('GetCurrentUser error', { error: errorMessage, component: 'getCurrentUser' });
    return { user: null, error: errorMessage }
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
      logger.error('Error fetching user data', { error: error.message, component: 'getUserData', userId });
      return null
    }

    return data
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error in getUserData', { error: errorMessage, component: 'getUserData', userId });
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
      logger.error('Update profile error', { error: error.message, component: 'updateUserProfile', userId });
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: unknown) {
    const errorMessage = getAuthErrorMessage(error);
    logger.error('Update profile error', { error: errorMessage, component: 'updateUserProfile', userId });
    return { data: null, error: errorMessage }
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
      logger.error('Change password error', { error: error.message, component: 'changePassword' });
      return { data: null, error: error.message }
    }
    
    return { data: data.user, error: null }
  } catch (error: unknown) {
    const errorMessage = getAuthErrorMessage(error);
    logger.error('Change password error', { error: errorMessage, component: 'changePassword' });
    return { data: null, error: errorMessage }
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
      logger.error('Reset password error', { error: error.message, component: 'resetPassword', email });
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: unknown) {
    const errorMessage = getAuthErrorMessage(error);
    logger.error('Reset password error', { error: errorMessage, component: 'resetPassword', email });
    return { data: null, error: errorMessage }
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
      logger.error('OAuth error', { error: error.message, component: 'signInWithOAuth', provider });
      return { data: null, error: error.message }
    }
    
    return { data, error: null }
  } catch (error: unknown) {
    const errorMessage = getAuthErrorMessage(error);
    logger.error('OAuth error', { error: errorMessage, component: 'signInWithOAuth', provider });
    return { data: null, error: errorMessage }
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
