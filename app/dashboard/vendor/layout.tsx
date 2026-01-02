'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import VendorSidebar from '@/components/VendorSidebar';

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
      <div className="flex min-h-screen bg-gray-50">
        <VendorSidebar />
        <main className="flex-1 lg:mr-64">
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
