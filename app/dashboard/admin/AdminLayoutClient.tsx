'use client';

import { DeliveryPackagesProvider } from '@/contexts/DeliveryPackagesContext';

/**
 * Client-side wrapper for Admin Dashboard
 * Provides client-side contexts and features
 */
export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DeliveryPackagesProvider>
      {children}
    </DeliveryPackagesProvider>
  );
}
