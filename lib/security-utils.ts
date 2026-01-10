/**
 * Security Utilities - أدوات الأمان
 * Input Sanitization & XSS Protection
 * 
 * التاريخ: 10 يناير 2026
 * الهدف: حماية من XSS و SQL Injection وتنظيف المدخلات
 */

// =====================================================
// 1. تنظيف النصوص من HTML Tags
// =====================================================

/**
 * إزالة جميع HTML tags من النص
 * @param input النص المدخل
 * @returns النص بدون HTML tags
 */
export function stripHtmlTags(input: string): string {
  if (!input) return '';
  return input.replace(/<[^>]*>/g, '');
}

/**
 * تنظيف النص من الأحرف الخطرة
 * @param input النص المدخل
 * @returns النص المنظف
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  
  // إزالة HTML tags
  let cleaned = stripHtmlTags(input);
  
  // إزالة JavaScript event handlers
  cleaned = cleaned.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // إزالة javascript: protocol
  cleaned = cleaned.replace(/javascript:/gi, '');
  
  // إزالة data: protocol (يمكن استخدامه في XSS)
  cleaned = cleaned.replace(/data:text\/html/gi, '');
  
  return cleaned.trim();
}

// =====================================================
// 2. Escape HTML Entities
// =====================================================

/**
 * تحويل الأحرف الخاصة إلى HTML entities
 * @param input النص المدخل
 * @returns النص مع HTML entities
 */
export function escapeHtml(input: string): string {
  if (!input) return '';
  
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return input.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char);
}

/**
 * عكس عملية escape HTML entities
 * @param input النص المدخل
 * @returns النص الأصلي
 */
export function unescapeHtml(input: string): string {
  if (!input) return '';
  
  const htmlEntities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#x2F;': '/',
  };
  
  return input.replace(/&[^;]+;/g, (entity) => htmlEntities[entity] || entity);
}

// =====================================================
// 3. التحقق من صحة المدخلات
// =====================================================

/**
 * التحقق من صحة البريد الإلكتروني
 * @param email البريد الإلكتروني
 * @returns true إذا كان صحيحاً
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * التحقق من صحة رقم الهاتف (صيغة سعودية)
 * @param phone رقم الهاتف
 * @returns true إذا كان صحيحاً
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  // صيغة سعودية: 05xxxxxxxx أو +9665xxxxxxxx أو 9665xxxxxxxx
  const phoneRegex = /^(05|5|\+9665|9665)[0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * التحقق من صحة UUID
 * @param uuid المعرف الفريد
 * @returns true إذا كان صحيحاً
 */
export function isValidUUID(uuid: string): boolean {
  if (!uuid) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * التحقق من صحة URL
 * @param url الرابط
 * @returns true إذا كان صحيحاً
 */
export function isValidUrl(url: string): boolean {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    // السماح فقط بـ http و https
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

// =====================================================
// 4. تنظيف الأرقام والمبالغ المالية
// =====================================================

/**
 * تنظيف وتحويل إلى رقم صحيح
 * @param input المدخل
 * @param defaultValue القيمة الافتراضية
 * @returns الرقم الصحيح
 */
export function sanitizeInteger(input: any, defaultValue: number = 0): number {
  const parsed = parseInt(String(input), 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * تنظيف وتحويل إلى رقم عشري
 * @param input المدخل
 * @param defaultValue القيمة الافتراضية
 * @param decimals عدد الأرقام العشرية
 * @returns الرقم العشري
 */
export function sanitizeDecimal(
  input: any,
  defaultValue: number = 0,
  decimals: number = 2
): number {
  const parsed = parseFloat(String(input));
  if (isNaN(parsed)) return defaultValue;
  return parseFloat(parsed.toFixed(decimals));
}

/**
 * التحقق من صحة المبلغ المالي
 * @param amount المبلغ
 * @param min الحد الأدنى
 * @param max الحد الأقصى
 * @returns true إذا كان صحيحاً
 */
export function isValidAmount(
  amount: number,
  min: number = 0,
  max: number = 1000000
): boolean {
  return typeof amount === 'number' && amount >= min && amount <= max;
}

// =====================================================
// 5. تنظيف النصوص الطويلة
// =====================================================

/**
 * تحديد طول النص
 * @param input النص المدخل
 * @param maxLength الحد الأقصى للطول
 * @returns النص المحدد
 */
export function truncateText(input: string, maxLength: number = 255): string {
  if (!input) return '';
  if (input.length <= maxLength) return input;
  return input.substring(0, maxLength) + '...';
}

/**
 * تنظيف النص من الأحرف الخاصة
 * @param input النص المدخل
 * @returns النص المنظف
 */
export function sanitizeFilename(input: string): string {
  if (!input) return '';
  // السماح فقط بالأحرف والأرقام والشرطة والنقطة
  return input.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// =====================================================
// 6. حماية من SQL Injection (للاستخدام مع raw queries)
// =====================================================

/**
 * Escape single quotes للاستخدام في SQL
 * ملاحظة: استخدم Prepared Statements بدلاً من هذا عندما يكون ممكناً
 * @param input النص المدخل
 * @returns النص المحمي
 */
export function escapeSqlString(input: string): string {
  if (!input) return '';
  return input.replace(/'/g, "''");
}

/**
 * التحقق من وجود محاولات SQL Injection
 * @param input النص المدخل
 * @returns true إذا كان مشبوهاً
 */
export function detectSqlInjection(input: string): boolean {
  if (!input) return false;
  
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(UNION\s+SELECT)/i,
    /(--|\#|\/\*|\*\/)/,
    /(\bOR\b\s+\d+\s*=\s*\d+)/i,
    /(\bAND\b\s+\d+\s*=\s*\d+)/i,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

// =====================================================
// 7. تنظيف JSON
// =====================================================

/**
 * تنظيف وتحليل JSON بشكل آمن
 * @param input النص المدخل
 * @param defaultValue القيمة الافتراضية
 * @returns الكائن المحلل
 */
export function sanitizeJson<T = any>(input: string, defaultValue: T | null = null): T | null {
  if (!input) return defaultValue;
  
  try {
    const parsed = JSON.parse(input);
    // التحقق من أن النتيجة ليست دالة أو رمز خطير
    if (typeof parsed === 'function') return defaultValue;
    return parsed;
  } catch {
    return defaultValue;
  }
}

// =====================================================
// 8. Content Security Policy Helpers
// =====================================================

/**
 * إنشاء nonce عشوائي لـ CSP
 * @returns nonce string
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// =====================================================
// 9. دوال مساعدة للتحقق من المدخلات
// =====================================================

/**
 * التحقق من صحة كائن الطلب
 * @param data البيانات
 * @param requiredFields الحقول المطلوبة
 * @returns { valid: boolean, errors: string[] }
 */
export function validateRequestData(
  data: Record<string, any>,
  requiredFields: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const field of requiredFields) {
    if (!data[field] || data[field] === '') {
      errors.push(`الحقل ${field} مطلوب`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * تنظيف كائن من القيم الخطرة
 * @param obj الكائن
 * @returns الكائن المنظف
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const cleaned: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      cleaned[key] = sanitizeText(value);
    } else if (typeof value === 'number') {
      cleaned[key] = value;
    } else if (typeof value === 'boolean') {
      cleaned[key] = value;
    } else if (value === null || value === undefined) {
      cleaned[key] = value;
    } else if (Array.isArray(value)) {
      cleaned[key] = value.map(item => 
        typeof item === 'string' ? sanitizeText(item) : item
      );
    } else if (typeof value === 'object') {
      cleaned[key] = sanitizeObject(value);
    }
  }
  
  return cleaned as T;
}

// =====================================================
// 10. Rate Limiting Helpers (للاستخدام في API routes)
// =====================================================

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * التحقق من Rate Limiting
 * @param identifier المعرف (IP أو User ID)
 * @param config الإعدادات
 * @returns { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 }
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  let record = rateLimitStore.get(identifier);
  
  if (!record || now > record.resetTime) {
    record = {
      count: 0,
      resetTime: now + config.windowMs
    };
  }
  
  record.count++;
  rateLimitStore.set(identifier, record);
  
  const allowed = record.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - record.count);
  
  return {
    allowed,
    remaining,
    resetTime: record.resetTime
  };
}

// =====================================================
// تصدير جميع الدوال
// =====================================================

export default {
  stripHtmlTags,
  sanitizeText,
  escapeHtml,
  unescapeHtml,
  isValidEmail,
  isValidPhone,
  isValidUUID,
  isValidUrl,
  sanitizeInteger,
  sanitizeDecimal,
  isValidAmount,
  truncateText,
  sanitizeFilename,
  escapeSqlString,
  detectSqlInjection,
  sanitizeJson,
  generateNonce,
  validateRequestData,
  sanitizeObject,
  checkRateLimit
};
