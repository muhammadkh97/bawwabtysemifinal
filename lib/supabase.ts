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

// عميل Supabase المحسّن مع دعم كامل للـ cookies والجلسات
// ✅ يحفظ الجلسة في cookies ويتزامن مع الـ middleware
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  cookies: {
    get(name: string) {
      if (typeof document === 'undefined') return undefined
      const value = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${name}=`))
        ?.split('=')[1]
      return value
    },
    set(name: string, value: string, options: any) {
      if (typeof document === 'undefined') return
      let cookie = `${name}=${value}`
      if (options?.maxAge) cookie += `; max-age=${options.maxAge}`
      if (options?.path) cookie += `; path=${options.path}`
      if (options?.domain) cookie += `; domain=${options.domain}`
      if (options?.sameSite) cookie += `; samesite=${options.sameSite}`
      if (options?.secure) cookie += '; secure'
      document.cookie = cookie
    },
    remove(name: string, options: any) {
      if (typeof document === 'undefined') return
      let cookie = `${name}=; max-age=0`
      if (options?.path) cookie += `; path=${options.path}`
      if (options?.domain) cookie += `; domain=${options.domain}`
      document.cookie = cookie
    },
  },
})
