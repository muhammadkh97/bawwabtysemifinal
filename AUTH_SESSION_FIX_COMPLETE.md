# 🔐 حل مشكلة تسجيل الدخول والجلسات

## 📋 المشكلة
المستخدم يسجل الدخول لكن:
- الصفحة تبقى تحمل
- عند فتح صفحة جديدة يظهر أنه مسجل دخول
- عند محاولة الذهاب لأي صفحة محمية يطلب تسجيل الدخول مرة أخرى

## 🔍 السبب الجذري

من فحص قاعدة البيانات تبين أن:
1. **RLS مفعل** على جدول users
2. **السياسات موجودة** بشكل صحيح
3. **دالة get_current_user موجودة**
4. ❌ **المشكلة**: عند تشغيل `SELECT * FROM get_current_user()` أعادت "No rows" - أي أن **auth.uid()** غير موجود

**السبب**: عدم تزامن بين:
- ✅ Session في localStorage (Client-side)
- ❌ Session في Cookies (Server-side/Middleware)

## ✅ الحل المطبق

### 1. تثبيت حزمة @supabase/ssr
```bash
npm install @supabase/ssr
```

### 2. إنشاء ملفات Supabase جديدة

#### **lib/supabase-client.ts** (للاستخدام في Client Components)
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### **lib/supabase-server.ts** (للاستخدام في Server Components)
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {}
        },
        remove(name: string, options) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {}
        },
      },
    }
  )
}
```

#### **lib/supabase-middleware.ts** (للاستخدام في Middleware)
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  return { response, user }
}
```

### 3. تحديث lib/supabase.ts
```typescript
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
```

### 4. تحديث middleware.ts
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase-middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  if (pathname.startsWith('/_next') || pathname.startsWith('/api/public') || pathname.includes('.')) {
    return NextResponse.next();
  }

  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/reset-password', '/'];
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith('/auth/'));

  // تحديث الجلسة والحصول على المستخدم
  const { response, user } = await updateSession(request);

  const protectedPrefixes = ['/dashboard', '/vendor', '/profile', '/orders', '/settings', '/admin'];
  const isProtectedRoute = protectedPrefixes.some(prefix => pathname.startsWith(prefix));

  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && (pathname === '/auth/login' || pathname === '/auth/signup')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

## 🧪 اختبار الحل

### 1. قم بتشغيل سكريبت الفحص
```powershell
.\scripts\test-auth-fix.ps1
```

### 2. امسح الـ cache وأعد التشغيل
```powershell
.\scripts\clean-restart.ps1
```

أو يدوياً:
```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

### 3. اختبار تسجيل الدخول
1. افتح المتصفح
2. اذهب إلى صفحة تسجيل الدخول
3. سجل الدخول
4. افتح DevTools (F12) → Application → Cookies
5. تأكد من وجود cookies تبدأ بـ `sb-*-auth-token`

### 4. اختبار التنقل
- حاول الذهاب إلى `/dashboard`
- حاول الذهاب إلى `/profile`
- يجب أن يعمل كل شيء بدون طلب تسجيل دخول مرة أخرى

## 🔧 استكشاف الأخطاء

### إذا لم تظهر الـ Cookies
```sql
-- في Supabase SQL Editor:
SELECT * FROM auth.users LIMIT 1;
```
تحقق من وجود المستخدم

### إذا ظهرت أخطاء TypeScript
```powershell
npm install --save-dev @types/cookie
```

### إذا ظهرت أخطاء في Build
```powershell
Remove-Item -Recurse -Force .next
npm run build
```

## 📊 مقارنة قبل وبعد

### قبل ❌
- استخدام `@supabase/supabase-js`
- Session في localStorage فقط
- Middleware لا يقرأ الـ cookies بشكل صحيح
- عدم تزامن بين client و server

### بعد ✅
- استخدام `@supabase/ssr`
- Session في Cookies (متزامنة)
- Middleware يحدث الجلسة تلقائياً
- تزامن كامل بين client و server

## 🎯 الملفات المعدلة

1. ✅ `lib/supabase.ts` - محدث
2. ✅ `lib/supabase-client.ts` - جديد
3. ✅ `lib/supabase-server.ts` - جديد
4. ✅ `lib/supabase-middleware.ts` - جديد
5. ✅ `middleware.ts` - محدث
6. ✅ `package.json` - إضافة @supabase/ssr

## 📚 مراجع
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
