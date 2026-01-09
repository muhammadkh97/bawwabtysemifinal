import { requireRole } from '@/lib/auth-server';
import DriverLayoutClient from './DriverLayoutClient';

/**
 * Server-Side Protected Layout for Driver Dashboard
 * ✅ Prevents FOUC (Flash of Unauthenticated Content)
 * ✅ Server-side session validation before rendering
 * ✅ Redirects unauthorized users immediately
 */
export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side authentication check - runs before page renders
  await requireRole('driver');

  return <DriverLayoutClient>{children}</DriverLayoutClient>;
}
