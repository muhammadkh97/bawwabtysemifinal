import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://itptinhxsylzvfcpxwpl.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0cHRpbmh4c3lsenZmY3B4d3BsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0MjczMjQsImV4cCI6MjA4MzAwMzMyNH0.iTc6noakhbFkn2SYEtb8FQjO7P1CsBP-AAfr3Xeu3Cw'

// إنشاء عميل Supabase مع تفعيل حفظ الجلسة في localStorage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // حفظ الجلسة في localStorage
    autoRefreshToken: true, // تحديث التوكن تلقائياً
    detectSessionInUrl: true, // كشف الجلسة من الرابط
    storage: typeof window !== 'undefined' ? (typeof window !== 'undefined' ? window.localStorage : undefined) : undefined, // استخدام localStorage
    storageKey: 'supabase.auth.token', // مفتاح التخزين
  },
})
