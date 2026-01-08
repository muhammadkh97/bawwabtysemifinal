// ==========================================
// BAWWABTY - UPDATED TYPE DEFINITIONS
// Matches the new database schema from force_rebuild.sql
// ==========================================

import { PostGISGeography } from './geo';

// ============ ENUMS ============

export type UserRole = 'customer' | 'vendor' | 'driver' | 'admin';
export type BusinessType = 'retail' | 'restaurant';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'wallet';
export type ProductStatus = 'draft' | 'pending' | 'approved' | 'rejected';
export type DeliveryStatus = 'idle' | 'assigned' | 'picked_up' | 'delivering' | 'completed';

// ============ CORE INTERFACES ============

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  vendor_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  user_id: string;
  name: string;
  name_ar?: string;
  description?: string;
  business_type: BusinessType;
  category?: string;
  phone?: string;
  email?: string;
  address?: string;
  lat?: number;
  lng?: number;
  location?: PostGISGeography; // PostGIS GEOGRAPHY type
  opening_hours?: {
    [key: string]: string; // e.g., { "monday": "9:00-22:00" }
  };
  is_online: boolean;
  is_active: boolean;
  theme_preference: string;
  logo_url?: string;
  banner_url?: string;
  rating: number;
  total_reviews: number;
  total_orders: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  name_ar?: string;
  slug: string;
  description?: string;
  icon?: string;
  parent_id?: string;
  requires_approval: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  vendor_id: string;
  category_id?: string;
  name: string;
  name_ar?: string;
  description?: string;
  slug: string;
  price: number;
  old_price?: number;
  original_currency: string;
  stock: number;
  low_stock_threshold: number;
  images: string[];
  featured_image?: string;
  status: ProductStatus;
  is_active: boolean;
  has_variants: boolean;
  variants?: ProductVariant[];
  attributes?: { [key: string]: unknown };
  metadata?: { [key: string]: unknown }; // For restaurant add-ons/modifiers
  rating: number;
  total_reviews: number;
  total_sales: number;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  price: number;
  stock: number;
  attributes?: { [key: string]: string }; // e.g., { "color": "red", "size": "XL" }
}

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  vendor_id: string;
  driver_id?: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  delivery_address?: string;
  delivery_lat?: number;
  delivery_lng?: number;
  delivery_location?: PostGISGeography; // PostGIS GEOGRAPHY
  delivery_notes?: string;
  delivery_time?: string;
  estimated_delivery?: string;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  completed_at?: string;
  cancelled_at?: string;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  product_image?: string;
  variant_id?: string;
  variant_name?: string;
  quantity: number;
  price: number;
  subtotal: number;
  modifiers?: OrderModifier[]; // For restaurant add-ons
}

export interface OrderModifier {
  name: string;
  price: number;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface Driver {
  id: string;
  user_id: string;
  vehicle_type?: string;
  vehicle_number?: string;
  license_number?: string;
  status: DeliveryStatus;
  current_lat?: number;
  current_lng?: number;
  current_location?: PostGISGeography; // PostGIS GEOGRAPHY
  is_available: boolean;
  is_active: boolean;
  rating: number;
  total_deliveries: number;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  order_id?: string;
  product_id?: string;
  vendor_id?: string;
  customer_id: string;
  rating: number; // 1-5
  comment?: string;
  images?: string[];
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type?: string;
  data?: { [key: string]: unknown };
  is_read: boolean;
  created_at: string;
}

// ============ API RESPONSE TYPES ============

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============ FORM TYPES ============

export interface StoreFormData {
  name: string;
  name_ar?: string;
  description?: string;
  business_type: BusinessType;
  category?: string;
  phone?: string;
  email?: string;
  address?: string;
  lat?: number;
  lng?: number;
  theme_preference?: string;
  logo_url?: string;
  banner_url?: string;
}

export interface ProductFormData {
  name: string;
  name_ar?: string;
  description?: string;
  category_id?: string;
  price: number;
  old_price?: number;
  stock: number;
  images: string[];
  has_variants: boolean;
  variants?: ProductVariant[];
  attributes?: { [key: string]: unknown };
  metadata?: { [key: string]: unknown };
}

export interface OrderFormData {
  vendor_id: string;
  items: OrderItem[];
  delivery_address: string;
  delivery_lat?: number;
  delivery_lng?: number;
  delivery_notes?: string;
  payment_method: PaymentMethod;
}

// ============ DASHBOARD STATS ============

export interface DashboardStats {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  total_revenue: number;
  total_products?: number;
  total_customers?: number;
  average_rating?: number;
}

export interface DriverStats {
  total_deliveries: number;
  active_deliveries: number;
  completed_today: number;
  earnings_today: number;
  average_rating: number;
}

// ============ MAP & LOCATION ============

export interface Location {
  lat: number;
  lng: number;
}

export interface DriverLocation extends Location {
  driver_id: string;
  driver_name: string;
  status: DeliveryStatus;
  timestamp: string;
}

export interface OrderLocation extends Location {
  order_id: string;
  order_number: string;
  status: OrderStatus;
  customer_name?: string;
  delivery_address?: string;
}

// ============ LEGACY COMPATIBILITY ============
// These types are kept for backward compatibility
// TODO: Migrate old code to use new types above

export interface Address {
  id?: string;
  title?: string;
  address: string;
  lat?: number;
  lng?: number;
  is_default?: boolean;
}

export interface Vendor {
  id: string;
  email: string;
  name: string;
  shop_name: string;
  phone?: string;
  role: 'vendor';
  approval_status?: 'pending' | 'approved' | 'rejected';
  shop_logo?: string;
  shop_banner?: string;
  rating?: number;
  total_sales?: number;
  is_active?: boolean;
  created_at?: string;
}

export interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'customer';
  avatar_url?: string;
  addresses?: Address[];
  created_at?: string;
}

// Driver Order type for driver dashboard
export interface DriverOrder extends Order {
  customer?: {
    name: string;
    phone?: string;
  };
  vendor?: {
    name: string;
    address?: string;
    phone?: string;
  };
}

// Export everything for convenience
// export type * from './supabase'; // Commented out - supabase types not yet generated
