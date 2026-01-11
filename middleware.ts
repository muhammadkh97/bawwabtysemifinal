import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase-middleware'

/**
 * Optimized Edge Middleware for Bawwabty - FIXED
 * ✅ استخدام @supabase/ssr للتعامل الصحيح مع الجلسات
 * ✅ تحديث الجلسة تلقائياً في كل طلب
 * ✅ دعم كامل للـ cookies
 * ✅ منع redirect loops
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. تخطي الملفات الثابتة والـ API العامة
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/public') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. المسارات العامة التي لا تحتاج تسجيل دخول
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/signup',
    '/auth/reset-password',
    '/auth/verify',
    '/about',
    '/contact',
    '/faq',
    '/categories',
    '/products',
    '/deals',
    '/offers'
  ];
  
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || 
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/categories/') ||
    pathname.startsWith('/products/') ||
    pathname.startsWith('/deals/') ||
    pathname.startsWith('/offers/')
  );

  // 3. تحديث الجلسة والحصول على المستخدم
  const { response, user } = await updateSession(request);

  // 4. المسارات المحمية
  const protectedPrefixes = ['/dashboard', '/vendor', '/profile', '/orders', '/settings', '/admin', '/account'];
  const isProtectedRoute = protectedPrefixes.some(prefix => pathname.startsWith(prefix));

  // 5. التحقق من المسارات المحمية
  if (isProtectedRoute && !user) {
    console.log('🔒 محاولة الوصول لصفحة محمية بدون تسجيل دخول:', pathname);
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 6. إذا كان المستخدم مسجل دخول ويحاول الوصول لصفحة تسجيل الدخول
  // نوجهه للصفحة الرئيسية أو dashboard حسب دوره
  if (user && pathname === '/auth/login') {
    console.log('✅ المستخدم مسجل دخول بالفعل، توجيه من صفحة تسجيل الدخول');
    const userRole = (user as any).role || 'customer';
    
    // التحقق من وجود redirect parameter
    const redirectParam = request.nextUrl.searchParams.get('redirect');
    if (redirectParam) {
      return NextResponse.redirect(new URL(redirectParam, request.url));
    }
    
    // التوجيه حسب الدور
    switch (userRole) {
      case 'admin':
        return NextResponse.redirect(new URL('/dashboard/admin', request.url));
      case 'vendor':
        return NextResponse.redirect(new URL('/dashboard/vendor', request.url));
      case 'restaurant':
        return NextResponse.redirect(new URL('/dashboard/restaurant', request.url));
      case 'driver':
        return NextResponse.redirect(new URL('/dashboard/driver', request.url));
      default:
        return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
