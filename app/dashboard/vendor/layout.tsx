'use client';

import ProtectedRoute from '@/components/ProtectedRoute';

/**
 * Layout لحماية جميع صفحات لوحة تحكم البائع
 * يضمن أن فقط المستخدمين بدور 'vendor' يمكنهم الوصول
 */
export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['vendor']}>
      {children}
    </ProtectedRoute>
  );
}
