import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// هذا middleware يعمل على مستوى Edge Runtime
// للحماية الأساسية فقط - الحماية الفعلية في الصفحات

export function middleware(request: NextRequest) {
  // السماح بجميع الطلبات لأن الحماية الفعلية في كل صفحة
  // هذا يمنع مشاكل SSR
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/vendor/:path*',
  ],
}
