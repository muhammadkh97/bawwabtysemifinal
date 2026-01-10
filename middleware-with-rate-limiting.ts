/**
 * Enhanced Middleware with Rate Limiting and Security Headers
 * Middleware محسّن مع Rate Limiting وأمان إضافي
 * 
 * التاريخ: 10 يناير 2026
 * يجمع بين: Session Management + Rate Limiting + Security Headers
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase-middleware';

// =====================================================
// Rate Limiting Storage
// =====================================================

interface RateLimitRecord {
  count: number;
  resetTime: number;
  blockedUntil?: number;
}

const requestCounts = new Map<string, RateLimitRecord>();
const loginAttempts = new Map<string, RateLimitRecord>();

// تنظيف السجلات القديمة كل 5 دقائق
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime && (!record.blockedUntil || now > record.blockedUntil)) {
      requestCounts.delete(key);
    }
  }
  for (const [key, record] of loginAttempts.entries()) {
    if (now > record.resetTime && (!record.blockedUntil || now > record.blockedUntil)) {
      loginAttempts.delete(key);
    }
  }
}, 5 * 60 * 1000);

// =====================================================
// Rate Limiting Function
// =====================================================

function checkRateLimit(
  ip: string,
  maxRequests: number,
  windowMs: number,
  storage: Map<string, RateLimitRecord>
): { allowed: boolean; retryAfter?: number; remaining?: number } {
  const now = Date.now();
  let record = storage.get(ip);
  
  if (record?.blockedUntil && now < record.blockedUntil) {
    const retryAfter = Math.ceil((record.blockedUntil - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + windowMs };
  }
  
  record.count++;
  storage.set(ip, record);
  
  if (record.count > maxRequests) {
    if (record.count > maxRequests + 10) {
      record.blockedUntil = now + 15 * 60 * 1000;
      storage.set(ip, record);
      return { allowed: false, retryAfter: 900 };
    }
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  const remaining = maxRequests - record.count;
  return { allowed: true, remaining };
}

// =====================================================
// Main Middleware
// =====================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  
  // =====================================================
  // 1. تخطي الملفات الثابتة
  // =====================================================
  
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/public') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // =====================================================
  // 2. Rate Limiting على API endpoints
  // =====================================================
  
  if (pathname.startsWith('/api/')) {
    let maxRequests = 100;
    let windowMs = 60 * 1000;
    
    // حدود صارمة لـ auth endpoints
    if (pathname.includes('/auth/') || pathname.includes('/login')) {
      maxRequests = 5;
      windowMs = 15 * 60 * 1000;
      
      const result = checkRateLimit(ip, maxRequests, windowMs, loginAttempts);
      
      if (!result.allowed) {
        return new NextResponse(
          JSON.stringify({
            error: 'too_many_requests',
            message: 'تم تجاوز الحد الأقصى للمحاولات. يرجى المحاولة لاحقاً.',
            retry_after_seconds: result.retryAfter
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': result.retryAfter?.toString() || '900',
              'X-RateLimit-Limit': maxRequests.toString(),
              'X-RateLimit-Remaining': '0'
            }
          }
        );
      }
    } else {
      const result = checkRateLimit(ip, maxRequests, windowMs, requestCounts);
      
      if (!result.allowed) {
        return new NextResponse(
          JSON.stringify({
            error: 'too_many_requests',
            message: 'تم تجاوز الحد الأقصى للطلبات. يرجى المحاولة لاحقاً.',
            retry_after_seconds: result.retryAfter
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': result.retryAfter?.toString() || '60'
            }
          }
        );
      }
    }
  }
  
  // =====================================================
  // 3. حماية من Bots المشبوهة
  // =====================================================
  
  const userAgent = request.headers.get('user-agent') || '';
  const suspiciousAgents = ['curl', 'wget', 'python-requests', 'scrapy'];
  const allowedBots = ['googlebot', 'bingbot', 'slurp', 'duckduckbot'];
  
  const isSuspicious = suspiciousAgents.some(agent => 
    userAgent.toLowerCase().includes(agent)
  );
  const isAllowedBot = allowedBots.some(bot => 
    userAgent.toLowerCase().includes(bot)
  );
  
  if (isSuspicious && !isAllowedBot && pathname.startsWith('/api/')) {
    return new NextResponse(
      JSON.stringify({ error: 'forbidden', message: 'Access denied' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // =====================================================
  // 4. Session Management (الكود الأصلي)
  // =====================================================
  
  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/reset-password', '/'];
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith('/auth/'));
  
  const { response, user } = await updateSession(request);
  
  const protectedPrefixes = ['/dashboard', '/vendor', '/profile', '/orders', '/settings', '/admin'];
  const isProtectedRoute = protectedPrefixes.some(prefix => pathname.startsWith(prefix));
  
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  // =====================================================
  // 5. إضافة Security Headers
  // =====================================================
  
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "img-src 'self' data: https: blob:; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co; " +
    "frame-ancestors 'none';"
  );
  
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=(self)'
  );
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

// =====================================================
// ملاحظات:
// 1. هذا الملف يجمع بين الـ middleware الأصلي والـ Rate Limiting
// 2. لتفعيله، استبدل محتوى middleware.ts بهذا الملف
// 3. في الإنتاج، استخدم Redis/Upstash بدلاً من Map
// =====================================================
