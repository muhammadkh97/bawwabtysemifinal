'use client';

import FuturisticSidebar from '@/components/dashboard/FuturisticSidebar';
import FuturisticNavbar from '@/components/dashboard/FuturisticNavbar';

/**
 * Client-side wrapper for Driver Dashboard
 * Provides client-side UI components and features
 */
export default function DriverLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0A0515]">
      <FuturisticSidebar role="driver" />
      <div className="md:mr-[280px] transition-all duration-300">
        <FuturisticNavbar userRole="مندوب توصيل" />
        <main className="pt-24 px-4 md:px-8 lg:px-10 pb-10">
          {children}
        </main>
      </div>
    </div>
  );
}
