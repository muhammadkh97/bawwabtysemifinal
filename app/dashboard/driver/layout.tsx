'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';

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
      <div className="min-h-screen bg-[#0A0515]">
        <FuturisticSidebar role="driver" />
        <div className="md:mr-[280px] transition-all duration-300">
          <FuturisticNavbar userRole="مندوب توصيل" />
          <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
