/**
 * Environment Variables Validation & Type Safety
 * يضمن وجود جميع المتغيرات المطلوبة ويوفر type-safe access
 */

// قائمة المتغيرات المطلوبة
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

// قائمة المتغيرات الاختيارية
const optionalEnvVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_APP_NAME',
] as const;

/**
 * التحقق من وجود جميع Environment Variables المطلوبة
 * @throws Error إذا كان أي متغير مطلوب غير موجود
 */
export function validateEnv(): void {
  const missing: string[] = [];

  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    const errorMessage = `
🚨 Missing required environment variables:
${missing.map(key => `  - ${key}`).join('\n')}

Please add these to your .env.local file.
See .env.example for reference.
    `.trim();

    throw new Error(errorMessage);
  }
}

// التحقق من البيئة عند التحميل
if (typeof window === 'undefined') {
  // Server-side only
  validateEnv();
}

/**
 * Type-safe environment variables
 * استخدم هذا بدلاً من process.env مباشرة
 */
export const env = {
  // Supabase
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // Site Info
  site: {
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Bawwabty',
  },

  // Environment
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const;

/**
 * Helper للحصول على متغير environment بأمان
 * @param key - اسم المتغير
 * @param defaultValue - القيمة الافتراضية إذا لم يكن موجوداً
 */
export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is not defined and no default value provided`);
  }
  
  return value || defaultValue!;
}

/**
 * Helper للحصول على متغير environment كـ boolean
 */
export function getEnvBoolean(key: string, defaultValue: boolean = false): boolean {
  const value = process.env[key];
  
  if (!value) return defaultValue;
  
  return value === 'true' || value === '1' || value === 'yes';
}

/**
 * Helper للحصول على متغير environment كـ number
 */
export function getEnvNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];
  
  if (!value) {
    if (defaultValue === undefined) {
      throw new Error(`Environment variable ${key} is not defined and no default value provided`);
    }
    return defaultValue;
  }
  
  const num = Number(value);
  
  if (isNaN(num)) {
    throw new Error(`Environment variable ${key} is not a valid number: ${value}`);
  }
  
  return num;
}

// Type للـ environment variables
export type Environment = typeof env;

export default env;
