<<<<<<< HEAD
// Driver & Orders Map Types
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
=======
// Driver & Orders Map Types
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
>>>>>>> 59cb1431e448110cfe49ca35fb79aa53e9d8b18b
