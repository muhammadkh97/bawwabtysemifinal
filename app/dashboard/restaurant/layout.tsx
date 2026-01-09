import { requireRole } from '@/lib/auth-server';
import RestaurantLayoutClient from './RestaurantLayoutClient';

/**
 * Server-Side Protected Layout for Restaurant Dashboard
 * ✅ Prevents FOUC (Flash of Unauthenticated Content)
 * ✅ Server-side session validation before rendering
 * ✅ Redirects unauthorized users immediately
 */
export default async function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side authentication check - runs before page renders
  await requireRole('restaurant');

  return <RestaurantLayoutClient>{children}</RestaurantLayoutClient>;
}
