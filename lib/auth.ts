import { supabase } from './supabase'

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
  } catch (error: any) {
    console.error('SignUp error:', error)
    return { user: null, error: error.message || 'حدث خطأ أثناء التسجيل' }
  }
}

/**
 * تسجيل الدخول - FIXED
 */
export async function signIn(email: string, password: string) {
  try {
    console.log('📝 محاولة تسجيل الدخول للبريد:', email);
    
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

    console.log('✅ تم تسجيل الدخول في Auth:', authData.user.id);

    // التحقق من Session
    if (!authData.session) {
      console.warn('⚠️ تحذير: لم يتم إنشاء Session');
    } else {
      console.log('✅ Session تم إنشاؤها بنجاح');
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

      const user = {
        id: authData.user.id,
        email: authData.user.email,
        role: directData?.user_role || authData.user.user_metadata?.role || 'customer',
        name: directData?.full_name || authData.user.user_metadata?.name || authData.user.email?.split('@')[0],
      };
      console.log('✅ استخدام بيانات بديلة:', user);
      return { 
        user, 
        error: null 
      }
    }

    console.log('✅ تم جلب بيانات المستخدم من public.users:', userData);

    // دمج بيانات auth مع بيانات public.users
    const safeUserData = ensureUserObject(userData)

    const user = {
      id: authData.user.id,
      email: authData.user.email,
      ...safeUserData,
      role: resolveRole(userData)
    };
    
    return { 
      user, 
      error: null 
    }
  } catch (error: any) {
    console.error('❌ خطأ غير متوقع في signIn:', error);
    return { user: null, error: error.message || 'حدث خطأ أثناء تسجيل الدخول' }
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
  } catch (error: any) {
    console.error('SignOut error:', error)
    return { error: error.message || 'حدث خطأ أثناء تسجيل الخروج' }
  }
}

/**
 * الحصول على المستخدم الحالي - FIXED
 */
export async function getCurrentUser(): Promise<{ user: any | null; error: string | null }> {
  try {
    // الحصول على بيانات المستخدم من Supabase Auth
    // في Supabase v2.45، لا توجد طريقة مباشرة getUser، نستخدم onAuthStateChange
    return new Promise((resolve) => {
      const unsubscribe = supabase.auth.onAuthStateChange(async (event, session) => {
        unsubscribe();
        
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
            }, 
            error: null 
          });
          return;
        }

        resolve({ 
          user: {
            ...user,
            ...ensureUserObject(userData),
            role: resolveRole(userData)
          }, 
          error: null 
        });
      });
    });
  } catch (error: any) {
    console.error('GetCurrentUser error:', error)
    return { user: null, error: error.message || 'حدث خطأ' }
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
export async function updateUserProfile(userId: string, updates: any) {
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
  } catch (error: any) {
    console.error('Update profile error:', error)
    return { data: null, error: error.message || 'حدث خطأ أثناء التحديث' }
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
  } catch (error: any) {
    console.error('Change password error:', error)
    return { data: null, error: error.message || 'حدث خطأ أثناء تغيير كلمة المرور' }
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
  } catch (error: any) {
    console.error('Reset password error:', error)
    return { data: null, error: error.message || 'حدث خطأ أثناء إعادة تعيين كلمة المرور' }
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
  } catch (error: any) {
    console.error('OAuth error:', error)
    return { data: null, error: error.message || 'حدث خطأ أثناء تسجيل الدخول' }
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
