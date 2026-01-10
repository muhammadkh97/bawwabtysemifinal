import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { redirect } from 'next/navigation';

export type UserRole = 'admin' | 'vendor' | 'driver' | 'customer' | 'restaurant';

interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  user_role: UserRole;
}

/**
 * Create Supabase client for server-side operations with enhanced security
 */
async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {}
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {}
        },
      },
    }
  );
}

/**
 * Server-side authentication check with enhanced validation
 * Use this in Server Components and Server Actions
 * ✅ Validates session existence
 * ✅ Verifies user in database
 * ✅ Returns null for any authentication failure
 */
export async function getServerSession(): Promise<AuthUser | null> {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get current user from auth session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return null;
    }

    // Get user details from public.users table using role field
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return null;
    }

    // Validate user role
    const validRoles: UserRole[] = ['admin', 'vendor', 'driver', 'customer', 'restaurant'];
    if (!validRoles.includes(userData.role as UserRole)) {
      return null;
    }

    return {
      id: userData.id,
      email: userData.email,
      full_name: userData.full_name,
      user_role: userData.role as UserRole,
    };
  } catch (error) {
    // Silent fail for security - don't expose error details
    return null;
  }
}

/**
 * Require authentication - redirects to login if not authenticated
 * ✅ Server-side only - runs before page render
 * ✅ Prevents FOUC (Flash of Unauthenticated Content)
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getServerSession();
  
  if (!user) {
    redirect('/auth/login');
  }
  
  // TypeScript لن يعلم أن redirect توقف التنفيذ، لذا نرجع user بشكل آمن
  return user as AuthUser;
}

/**
 * Require specific role(s) - redirects to appropriate page
 * ✅ Role-based access control at server level
 * ✅ Redirects unauthorized users to their correct dashboard
 * ✅ Prevents privilege escalation
 */
export async function requireRole(allowedRoles: UserRole | UserRole[]): Promise<AuthUser> {
  const user = await requireAuth();
  
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  if (!roles.includes(user.user_role)) {
    // User is authenticated but doesn't have required role
    // Redirect to appropriate dashboard based on actual role
    switch (user.user_role) {
      case 'admin':
        redirect('/dashboard/admin');
      case 'vendor':
        redirect('/dashboard/vendor');
      case 'restaurant':
        redirect('/dashboard/restaurant');
      case 'driver':
        redirect('/dashboard/driver');
      case 'customer':
        redirect('/');
      default:
        // Fallback - should never reach here
        redirect('/auth/login');
    }
  }
  
  return user;
}

/**
 * Check if user is authenticated (doesn't redirect)
 * Use this when you need to check auth status without forcing redirect
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getServerSession();
  return user !== null;
}

/**
 * Check if user has specific role (doesn't redirect)
 * Use this for conditional rendering based on role
 */
export async function hasRole(role: UserRole | UserRole[]): Promise<boolean> {
  const user = await getServerSession();
  
  if (!user) return false;
  
  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(user.user_role);
}

/**
 * Get user role safely (returns null if not authenticated)
 */
export async function getUserRole(): Promise<UserRole | null> {
  const user = await getServerSession();
  return user?.user_role || null;
}

/**
 * Verify admin access (throws if not admin)
 */
export async function requireAdmin(): Promise<AuthUser> {
  return requireRole('admin');
}

/**
 * Verify vendor access (throws if not vendor)
 */
export async function requireVendor(): Promise<AuthUser> {
  return requireRole('vendor');
}

/**
 * Verify driver access (throws if not driver)
 */
export async function requireDriver(): Promise<AuthUser> {
  return requireRole('driver');
}

/**
 * Verify restaurant access (throws if not restaurant)
 */
export async function requireRestaurant(): Promise<AuthUser> {
  return requireRole('restaurant');
}
