'use client';

import ProtectedRoute from '@/components/ProtectedRoute';

/**
 * Layout لحماية جميع صفحات لوحة تحكم المطعم
 * يضمن أن فقط المستخدمين بدور 'restaurant' يمكنهم الوصول
 */
export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['restaurant']}>
      {children}
    </ProtectedRoute>
  );
}
