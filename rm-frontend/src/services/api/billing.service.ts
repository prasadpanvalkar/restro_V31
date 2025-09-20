// src/services/api/billing.service.ts
import apiClient from './config';
import { Order, PaymentMethod } from '@/types/order.types';

interface Analytics {
  sales_today: string;
  sales_this_month: string;
  top_dish_today: string;
  top_dish_this_month: string;
}

class BillingService {
  // Cashier APIs
  async getPendingBills(): Promise<Order[]> {
    const response = await apiClient.get<Order[]>('/cashier/pending-bills/');
    return response.data;
  }

  async markBillAsPaid(billId: number, paymentMethod: PaymentMethod): Promise<void> {
    await apiClient.post(`/cashier/bills/${billId}/pay/`, { 
      payment_method: paymentMethod 
    });
  }

  // Analytics APIs
  async getAdminAnalytics(): Promise<Analytics> {
    const response = await apiClient.get<Analytics>('/admin/analytics/');
    return response.data;
  }

  async getRestaurantAnalytics(): Promise<Analytics> {
    const response = await apiClient.get<Analytics>('/restaurant/analytics/');
    return response.data;
  }
}

export default new BillingService();