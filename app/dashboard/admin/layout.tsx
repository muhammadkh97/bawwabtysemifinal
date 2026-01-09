import { requireRole } from '@/lib/auth-server';
import AdminLayoutClient from './AdminLayoutClient';

/**
 * Server-Side Protected Layout for Admin Dashboard
 * ✅ Prevents FOUC (Flash of Unauthenticated Content)
 * ✅ Server-side session validation before rendering
 * ✅ Redirects unauthorized users immediately
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side authentication check - runs before page renders
  await requireRole('admin');

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
