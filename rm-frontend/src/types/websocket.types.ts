// src/types/websocket.types.ts
export interface WebSocketMessage {
  bill_id?: number;
  table_number: string;
  customer_name?: string;
  items: {
    order_item_id?: number;
    name: string;
    variant: string;
    quantity: number;
    price?: number;
  }[];
  total_amount?: number;
}

export interface OrderStatusUpdate {
  order_item_id: number;
  status: string;
  item_name: string;
  preparation_time?: number;
}

export interface CashierNotification {
  id: number;
  table_number: string;
  totalAmount: number;
  items: {
    name: string;
    variant_name: string;
    quantity: number;
    price: number;
  }[];
}