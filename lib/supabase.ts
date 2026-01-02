import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// إنشاء عميل Supabase مع تفعيل حفظ الجلسة في localStorage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // حفظ الجلسة في localStorage
    autoRefreshToken: true, // تحديث التوكن تلقائياً
    detectSessionInUrl: true, // كشف الجلسة من الرابط
    storage: typeof window !== 'undefined' ? window.localStorage : undefined, // استخدام localStorage
    storageKey: 'supabase.auth.token', // مفتاح التخزين
  },
})
