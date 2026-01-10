import { createBrowserClient } from '@supabase/ssr'

// ⚠️ SECURITY: Never hardcode API keys - Always use environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.\n' +
    'Required variables:\n' +
    '- NEXT_PUBLIC_SUPABASE_URL\n' +
    '- NEXT_PUBLIC_SUPABASE_ANON_KEY'
  )
}

// عميل Supabase الجديد باستخدام @supabase/ssr
// يدعم الـ cookies بشكل صحيح ويتزامن مع الـ middleware
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
