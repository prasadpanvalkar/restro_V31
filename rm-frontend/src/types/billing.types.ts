// src/types/billing.types.ts
export interface Analytics {
  sales_today: string;
  sales_this_month: string;
  top_dish_today: string;
  top_dish_this_month: string;
}

export interface BillingSummary {
  total_amount: number;
  items_count: number;
  paid_bills: number;
  pending_bills: number;
}

export interface PaymentSummary {
  payment_method: 'CASH' | 'CARD' | 'UPI' | 'ONLINE' | 'OFFLINE';
  amount: number;
  date: string;
}