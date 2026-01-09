import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

export type UserRole = 'admin' | 'vendor' | 'driver' | 'customer' | 'restaurant';

interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  user_role: UserRole;
}

/**
 * Create Supabase client for server-side operations
 */
function createServerSupabaseClient() {
  const cookieStore = cookies();
  
  // Get auth token from cookies
  const accessToken = cookieStore.get('sb-access-token')?.value;
  const refreshToken = cookieStore.get('sb-refresh-token')?.value;
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: accessToken ? {
          Authorization: `Bearer ${accessToken}`,
        } : {},
      },
    }
  );
}

/**
 * Server-side authentication check
 * Use this in Server Components and Server Actions
 */
export async function getServerSession(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies();
    
    // Check for Supabase auth cookies
    const allCookies = cookieStore.getAll();
    const authCookie = allCookies.find(cookie => 
      cookie.name.includes('sb-') && cookie.name.includes('auth-token')
    );
    
    if (!authCookie) {
      return null;
    }

    const supabase = createServerSupabaseClient();
    
    // Get current user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    // Get user details from public.users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, user_role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return null;
    }

    return {
      id: userData.id,
      email: userData.email,
      full_name: userData.full_name,
      user_role: userData.user_role as UserRole,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Require authentication - redirects to login if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getServerSession();
  
  if (!user) {
    redirect('/auth/login');
  }
  
  return user;
}

/**
 * Require specific role(s) - redirects to login or unauthorized page
 */
export async function requireRole(allowedRoles: UserRole | UserRole[]): Promise<AuthUser> {
  const user = await requireAuth();
  
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  if (!roles.includes(user.user_role)) {
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
      default:
        redirect('/');
    }
  }
  
  return user;
}

/**
 * Check if user is authenticated (doesn't redirect)
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getServerSession();
  return user !== null;
}

/**
 * Check if user has specific role (doesn't redirect)
 */
export async function hasRole(role: UserRole | UserRole[]): Promise<boolean> {
  const user = await getServerSession();
  
  if (!user) return false;
  
  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(user.user_role);
}
