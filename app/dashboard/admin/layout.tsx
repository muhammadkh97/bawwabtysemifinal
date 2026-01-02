'use client';

import ProtectedRoute from '@/components/ProtectedRoute';

/**
 * Layout لحماية جميع صفحات لوحة تحكم المدير
 * يضمن أن فقط المستخدمين بدور 'admin' يمكنهم الوصول
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      {children}
    </ProtectedRoute>
  );
}
