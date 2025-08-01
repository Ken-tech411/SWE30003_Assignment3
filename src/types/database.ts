// Database schema types for the pharmacy app

export interface User {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  role: 'customer' | 'pharmacist' | 'admin';
  created_at: Date;
  updated_at: Date;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  category: string;
  manufacturer: string;
  requires_prescription: boolean;
  image_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Order {
  id: number;
  user_id: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: string;
  payment_method: string;
  payment_status: 'pending' | 'completed' | 'failed';
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  created_at: Date;
}

export interface Prescription {
  id: number;
  user_id: number;
  doctor_name: string;
  doctor_license: string;
  prescription_date: Date;
  expiry_date: Date;
  image_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
  updated_at: Date;
}

export interface Cart {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  created_at: Date;
  updated_at: Date;
}

export interface Delivery {
  id: number;
  order_id: number;
  tracking_number: string;
  carrier: string;
  status: 'preparing' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed';
  estimated_delivery: Date;
  actual_delivery?: Date;
  shipping_address: string;
  created_at: Date;
  updated_at: Date;
}
