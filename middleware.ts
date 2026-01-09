import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Edge Middleware for Dashboard Routes Protection
 * Provides first-layer authentication check at the edge
 * Combined with server-side layout checks for maximum security
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check for Supabase auth cookies
  const authCookie = request.cookies.getAll().find(cookie => 
    cookie.name.includes('sb-') && cookie.name.includes('auth-token')
  );
  
  // If no auth cookie and accessing dashboard, redirect to login
  if (!authCookie && pathname.startsWith('/dashboard')) {
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If authenticated cookie exists, let the request proceed
  // Server-side layouts will handle role-based access control
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
  ],
}

