/**
 * =========================================================
 * Database Types - Auto-generated from Supabase Schema
 * =========================================================
 * يتم إنشاء هذا الملف تلقائياً من schema قاعدة البيانات
 * لا تقم بتعديل هذا الملف يدوياً
 * 
 * للتحديث: استخدم Supabase CLI
 * npx supabase gen types typescript --project-id your-project-id > types/database.ts
 * =========================================================
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          phone: string | null
          full_name: string
          avatar_url: string | null
          user_role: 'admin' | 'vendor' | 'restaurant' | 'driver' | 'customer'
          is_active: boolean
          is_verified: boolean
          email_verified: boolean
          phone_verified: boolean
          address: string | null
          city: string | null
          region: string | null
          postal_code: string | null
          country: string
          latitude: number | null
          longitude: number | null
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          phone?: string | null
          full_name: string
          avatar_url?: string | null
          user_role?: 'admin' | 'vendor' | 'restaurant' | 'driver' | 'customer'
          is_active?: boolean
          is_verified?: boolean
          email_verified?: boolean
          phone_verified?: boolean
          address?: string | null
          city?: string | null
          region?: string | null
          postal_code?: string | null
          country?: string
          latitude?: number | null
          longitude?: number | null
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          phone?: string | null
          full_name?: string
          avatar_url?: string | null
          user_role?: 'admin' | 'vendor' | 'restaurant' | 'driver' | 'customer'
          is_active?: boolean
          is_verified?: boolean
          email_verified?: boolean
          phone_verified?: boolean
          address?: string | null
          city?: string | null
          region?: string | null
          postal_code?: string | null
          country?: string
          latitude?: number | null
          longitude?: number | null
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // يمكن إضافة الجداول الأخرى هنا
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'vendor' | 'restaurant' | 'driver' | 'customer'
      vendor_type: 'restaurant' | 'shop' | 'supermarket' | 'pharmacy' | 'grocery' | 'electronics' | 'fashion' | 'beauty' | 'home' | 'sports' | 'books' | 'toys' | 'other'
      vendor_status: 'pending' | 'approved' | 'rejected' | 'suspended' | 'closed'
      order_status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded'
      delivery_status: 'pending' | 'assigned' | 'accepted' | 'picked_up' | 'in_transit' | 'arrived' | 'delivered' | 'failed' | 'returned'
      payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled'
      payment_method: 'cash' | 'card' | 'wallet' | 'bank_transfer' | 'credit'
    }
  }
}
