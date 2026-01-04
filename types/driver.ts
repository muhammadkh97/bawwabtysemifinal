// Driver & Orders Map Types
export interface DriverOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  delivery_fee?: number;
  created_at?: string;
  delivery_latitude?: number | null;
  delivery_longitude?: number | null;
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
