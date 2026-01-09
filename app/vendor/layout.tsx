import { requireRole } from '@/lib/auth-server';

/**
 * Server-Side Protected Layout for Vendor Routes
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
  // Only vendors can access /vendor routes
  await requireRole('vendor');

  return <>{children}</>;
}

