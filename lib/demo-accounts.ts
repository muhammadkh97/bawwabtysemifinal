// ═══════════════════════════════════════════════════════════════
// ⚠️ تم تعطيل الحسابات التجريبية
// Demo Accounts Disabled
// ═══════════════════════════════════════════════════════════════
// 
// تم حذف جميع الحسابات والبيانات التجريبية من المشروع
// All demo accounts and data have been removed from the project
//
// للحصول على حساب admin، استخدم:
// To get an admin account, use:
// - muhmdadk@gmail.com (configured as admin)
//
// ═══════════════════════════════════════════════════════════════

import { signIn } from './auth';

export interface DemoAccount {
  role: 'admin' | 'vendor' | 'driver' | 'customer';
  email: string;
  password: string;
  name: string;
  description: string;
}

// تم تعطيل الحسابات التجريبية
// Demo accounts are disabled
export const DEMO_ACCOUNTS: DemoAccount[] = [];

export async function quickLoginDemo(role: 'admin' | 'vendor' | 'driver' | 'customer') {
  // تم تعطيل تسجيل الدخول التجريبي
  throw new Error('تم تعطيل الحسابات التجريبية. الرجاء التسجيل أو استخدام حسابك الخاص.');
}

export function getCurrentDemoUser(): DemoAccount | null {
  // تم تعطيل الحسابات التجريبية
  return null;
}

export function logoutDemo(): void {
  // لا يوجد حسابات تجريبية لتسجيل الخروج منها
  if (typeof window !== 'undefined') {
    localStorage.removeItem('demoUser');
  }
}
