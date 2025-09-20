// src/types/order.types.ts
export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'DECLINED';
export type PaymentStatus = 'PENDING' | 'PAID';
export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'ONLINE' | 'OFFLINE';

export interface OrderItem {
  id: number;
  name: string;
  variant_name: string;
  quantity: number;
  status: OrderStatus;
  price?: number;
}

export interface Order {
  id: number;
  table_number: string;
  customer_name: string;
  created_at: string;
  order_items: OrderItem[];
  payment_status?: PaymentStatus;
  payment_method?: PaymentMethod;
  total_price?: number;
}

export interface CreateOrderRequest {
  table_number: string;
  customer_name: string;
  order_items: {
    variant_id: number;
    quantity: number;
  }[];
}

export interface FrontendOrderRequest {
  table_number: string;
  customer_name: string;
  items: {
    menu_item_id: number;
    variant_name: string;
    quantity: number;
  }[];
}

export interface CreateOrderResponse {
  order_id: number;
  queue_number: number;
}

export interface KitchenOrder {
  id: number;
  table_number: string;
  customer_name: string;
  created_at: string;
  order_items: OrderItem[];
}