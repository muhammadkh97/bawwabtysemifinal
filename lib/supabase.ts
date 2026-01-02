import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qigqcyoggtxjtottlhpl.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpZ3FjeW9nZ3R4anRvdHRsaHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyNzg0OTQsImV4cCI6MjA4Mjg1NDQ5NH0.lFu4SgGHOgVm31VEwv0Yb1c2klJ4hxbgH5G4eE9J3vk'

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
