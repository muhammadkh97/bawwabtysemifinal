// ============ User Roles & Types ============
export type UserRole = 'admin' | 'vendor' | 'driver' | 'customer';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type OrderStatus = 'pending' | 'processing' | 'ready' | 'shipped' | 'delivered' | 'cancelled';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'rejected';
export type ProductStatus = 'draft' | 'pending' | 'approved' | 'rejected';

// ============ User Interfaces ============
export interface BaseUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  created_at: string;
  updated_at?: string;
  is_active: boolean;
}

// Union type for all users
export type User = Admin | Vendor | Driver | Customer;

// Profile types for API
export interface VendorProfile {
  shop_name: string;
  shop_logo?: string;
  shop_banner?: string;
  shop_description?: string;
  commission_rate: number;
}

export interface DriverProfile {
  vehicle_type: string;
  vehicle_number: string;
  license_number: string;
  license_image?: string;
  is_available: boolean;
}

// Payout request interface
export interface PayoutRequest {
  id: string;
  user_id: string;
  amount: number;
  status: PayoutStatus;
  bank_details?: {
    bank_name: string;
    account_number: string;
    account_holder: string;
  };
  requested_at: string;
  processed_at?: string;
  notes?: string;
}

export interface Admin extends BaseUser {
  role: 'admin';
  permissions: string[];
}

export interface Vendor extends BaseUser {
  role: 'vendor';
  shop_name: string;
  shop_logo?: string;
  shop_banner?: string;
  shop_description?: string;
  approval_status: ApprovalStatus;
  documents?: string[];
  commission_rate: number;
  total_sales: number;
  total_products: number;
  rating: number;
  wallet_balance: number;
  bank_account?: {
    bank_name: string;
    account_number: string;
    account_holder: string;
  };
}

export interface Driver extends BaseUser {
  role: 'driver';
  vehicle_type: string;
  vehicle_number: string;
  license_number: string;
  license_image?: string;
  approval_status: ApprovalStatus;
  is_available: boolean;
  current_location?: {
    lat: number;
    lng: number;
  };
  total_deliveries: number;
  rating: number;
  wallet_balance: number;
}

export interface Customer extends BaseUser {
  role: 'customer';
  addresses?: Address[];
  default_address_id?: string;
  total_orders: number;
}

// ============ Product Interfaces ============
export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  attributes: {
    [key: string]: string;
  };
}

export interface Product {
  id: string;
  vendor_id: string;
  vendor_name: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  original_currency?: string;
  images: string[];
  category: string;
  subcategory?: string;
  status: ProductStatus;
  stock: number;
  low_stock_threshold: number;
  variants?: ProductVariant[];
  rating: number;
  reviews_count: number;
  total_sales: number;
  featured: boolean;
  created_at: string;
  updated_at?: string;
  rejection_reason?: string;
}

// ============ Order Interfaces ============
export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  variant_id?: string;
  variant_name?: string;
  quantity: number;
  price: number;
  vendor_id: string;
  vendor_name: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  tax: number;
  platform_commission: number;
  total: number;
  status: OrderStatus;
  delivery_address: Address | string;
  driver_id?: string;
  driver_name?: string;
  payment_method: 'cash' | 'card' | 'wallet';
  payment_status: 'pending' | 'paid' | 'refunded';
  notes?: string;
  tracking_number?: string;
  created_at: string;
  updated_at?: string;
  delivered_at?: string;
  estimated_delivery: string;
  // Extended properties for driver orders map
  customer?: {
    id: string;
    name: string;
    phone?: string;
  };
  vendor?: {
    id: string;
    store_name: string;
    store_latitude?: number;
    store_longitude?: number;
    store_address?: string;
  };
}

// ============ Address Interface ============
export interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  postal_code?: string;
  country: string;
  lat?: number;
  lng?: number;
  is_default: boolean;
}

// ============ Financial Interfaces ============
export interface Payout {
  id: string;
  user_id: string;
  user_name: string;
  user_role: 'vendor' | 'driver';
  amount: number;
  status: PayoutStatus;
  bank_details: {
    bank_name: string;
    account_number: string;
    account_holder: string;
  };
  requested_at: string;
  processed_at?: string;
  processed_by?: string;
  rejection_reason?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  order_id?: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  balance_after: number;
  created_at: string;
}

export interface Commission {
  id: string;
  order_id: string;
  vendor_id: string;
  order_total: number;
  commission_rate: number;
  commission_amount: number;
  vendor_earning: number;
  created_at: string;
}

// ============ Review & Rating ============
export interface Review {
  id: string;
  product_id: string;
  customer_id: string;
  customer_name: string;
  order_id: string;
  rating: number;
  comment?: string;
  images?: string[];
  vendor_reply?: string;
  created_at: string;
  replied_at?: string;
}

// ============ Coupon & Promotion ============
export interface Coupon {
  id: string;
  vendor_id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase?: number;
  max_discount?: number;
  usage_limit?: number;
  used_count: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

// ============ Category ============
export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  parent_id?: string;
  is_active: boolean;
  order: number;
  productsCount?: number;
}

export interface PlatformSettings {
  id: string;
  default_commission_rate: number;
  default_tax_rate: number;
  min_payout_amount: number;
  delivery_base_fee: number;
  delivery_per_km_fee: number;
  welcome_message?: string;
  notification_templates?: {
    [key: string]: string;
  };
}

// ============ Ticket & Dispute ============
export interface Ticket {
  id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at?: string;
  resolved_at?: string;
  resolved_by?: string;
  responses?: TicketResponse[];
}

export interface TicketResponse {
  id: string;
  ticket_id: string;
  user_id: string;
  user_name: string;
  message: string;
  created_at: string;
}

export interface Dispute {
  id: string;
  order_id: string;
  customer_id: string;
  vendor_id: string;
  reason: string;
  description: string;
  evidence?: string[];
  status: 'open' | 'under_review' | 'resolved';
  resolution?: 'refund_customer' | 'release_to_vendor' | 'partial_refund';
  resolution_note?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

// ============ Notification ============
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'product' | 'system' | 'dispute';
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

// ============ Analytics & Dashboard Stats ============
export interface DashboardStats {
  total_sales: number;
  total_orders: number;
  total_vendors: number;
  total_customers: number;
  total_products: number;
  pending_approvals: {
    vendors: number;
    products: number;
    drivers: number;
  };
  revenue_today: number;
  revenue_this_month: number;
  revenue_this_year: number;
}

export interface VendorStats {
  total_products: number;
  active_products: number;
  pending_products: number;
  total_orders: number;
  pending_orders: number;
  total_sales: number;
  wallet_balance: number;
  pending_payouts: number;
  rating: number;
  reviews_count: number;
}

export interface DriverStats {
  total_deliveries: number;
  completed_today: number;
  in_progress: number;
  wallet_balance: number;
  rating: number;
  total_earnings: number;
}

// ============ Cart ============
export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  variant_id?: string;
}

// ============ Driver Types ============
export interface DriverOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at?: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  delivery_address?: string;
  customer: {
    id: string;
    name: string;
    phone?: string;
  };
  vendor: {
    id: string;
    store_name: string;
    store_latitude?: number;
    store_longitude?: number;
    store_address?: string;
  };
}

export interface DriverLocation {
  lat: number;
  lng: number;
}
