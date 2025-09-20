import apiClient from './config';
import { 
  Order, 
  CreateOrderRequest, 
  FrontendOrderRequest,
  CreateOrderResponse,
  KitchenOrder,
  OrderStatus 
} from '@/types/order.types';

class OrderService {
  // Captain APIs
  async createOrder(data: CreateOrderRequest): Promise<Order> {
    const response = await apiClient.post<Order>('/captain/orders/create/', data);
    return response.data;
  }

  async reorder(billId: number, items: CreateOrderRequest['order_items']): Promise<void> {
    await apiClient.post(`/captain/bills/${billId}/reorder/`, { order_items: items });
  }

  // Frontend/Customer APIs
  async createCustomerOrder(
    restaurantSlug: string, 
    data: FrontendOrderRequest
  ): Promise<CreateOrderResponse> {
    const response = await apiClient.post<CreateOrderResponse>(
      `/restaurants/${restaurantSlug}/orders/`,
      data
    );
    return response.data;
  }

  // --- NEW FUNCTION ADDED HERE ---
  /**
   * Adds a list of new items to an existing, pending order.
   * @param orderId The ID of the existing bill/order.
   * @param items The array of new items to add.
   * @returns The full, updated order object from the server.
   */
  async addItemsToOrder(orderId: number, items: any[]): Promise<any> {
    // This calls the new backend endpoint: /api/orders/{bill_id}/add_items/
    const response = await apiClient.post(`/orders/${orderId}/add_items/`, { items });
    return response;
  }
  // --- END OF NEW FUNCTION ---

  // Chef APIs
  async getKitchenOrders(): Promise<KitchenOrder[]> {
    const response = await apiClient.get<KitchenOrder[]>('/kitchen/orders/');
    return response.data;
  }

  async updateOrderItemStatus(itemId: number, status: OrderStatus): Promise<void> {
    await apiClient.post(`/order-items/${itemId}/update-status/`, { status });
  }

  // Restaurant Admin APIs
  async getRestaurantOrders(): Promise<Order[]> {
    const response = await apiClient.get<Order[]>('/restaurant/orders/');
    return response.data;
  }

  async getOrderReport(period: 'today' | 'week' | 'month' | 'year'): Promise<Order[]> {
    const response = await apiClient.get<Order[]>(
      `/restaurant/reports/orders/?period=${period}`
    );
    return response.data;
  }
}

export default new OrderService();