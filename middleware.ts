import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Optimized Edge Middleware for Bawwabty
 * ✅ Efficient session validation
 * ✅ Improved performance by avoiding redundant DB calls
 * ✅ Strict route protection
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. Skip middleware for static assets and public files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/public') ||
    pathname.includes('.') // matches files like favicon.ico, images, etc.
  ) {
    return NextResponse.next();
  }

  // 2. Define public routes
  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/reset-password', '/'];
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith('/auth/'));

  // 3. Check for auth cookie presence first (Fast check)
  const authCookie = request.cookies.getAll().find(cookie => 
    cookie.name.includes('sb-') && cookie.name.includes('auth-token')
  );

  // 4. Protected routes logic
  const protectedPrefixes = ['/dashboard', '/vendor', '/profile', '/orders', '/settings'];
  const isProtectedRoute = protectedPrefixes.some(prefix => pathname.startsWith(prefix));

  if (isProtectedRoute && !authCookie) {
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 5. Deep validation for sensitive routes only (Dashboard)
  if (pathname.startsWith('/dashboard') && authCookie) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              cookie: request.headers.get('cookie') || '',
            },
          },
        }
      );
      
      // Use getUser() for secure server-side validation
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        const redirectUrl = new URL('/auth/login', request.url);
        return NextResponse.redirect(redirectUrl);
      }
      
      return NextResponse.next();
    } catch (e) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
