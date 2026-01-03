'use client';

import ProtectedRoute from '@/components/ProtectedRoute';

/**
 * Layout لحماية جميع صفحات لوحة تحكم مندوب التوصيل
 * يضمن أن فقط المستخدمين بدور 'driver' يمكنهم الوصول
 */
export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['driver']}>
      {children}
    </ProtectedRoute>
  );
}
