import { requireRole } from '@/lib/auth-server';
import VendorLayoutClient from './VendorLayoutClient';

/**
 * Server-Side Protected Layout for Vendor Dashboard
 * ✅ Prevents FOUC (Flash of Unauthenticated Content)
 * ✅ Server-side session validation before rendering
 * ✅ Redirects unauthorized users immediately
 */
export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side authentication check - runs before page renders
  await requireRole('vendor');

  return <VendorLayoutClient>{children}</VendorLayoutClient>;
}
