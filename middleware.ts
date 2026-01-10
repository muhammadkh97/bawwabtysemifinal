import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase-middleware'

/**
 * Optimized Edge Middleware for Bawwabty - FIXED
 * ✅ استخدام @supabase/ssr للتعامل الصحيح مع الجلسات
 * ✅ تحديث الجلسة تلقائياً في كل طلب
 * ✅ دعم كامل للـ cookies
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. تخطي الملفات الثابتة
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/public') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. المسارات العامة
  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/reset-password', '/'];
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith('/auth/'));

  // 3. تحديث الجلسة والحصول على المستخدم
  const { response, user } = await updateSession(request);

  // 4. المسارات المحمية
  const protectedPrefixes = ['/dashboard', '/vendor', '/profile', '/orders', '/settings', '/admin'];
  const isProtectedRoute = protectedPrefixes.some(prefix => pathname.startsWith(prefix));

  // 5. التحقق من المسارات المحمية
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 6. السماح بالوصول لصفحات التسجيل/الدخول دائماً (سيتم التعامل معها في الصفحة نفسها)
  // لا نقوم بالـ redirect هنا لتجنب infinite loop

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
