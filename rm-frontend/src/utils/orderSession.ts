// src/utils/orderSession.ts
export interface SessionOrder {
  orderId: number;
  queueNumber: number;
  tableNumber: string;
  customerName: string;
  items: any[];
  restaurantSlug: string;
  createdAt: string;
}

export class OrderSessionManager {
  private static readonly SESSION_KEY = 'currentOrder';
  private static readonly EXPIRY_HOURS = 4;

  static saveOrder(order: SessionOrder): void {
    const orderWithTimestamp = {
      ...order,
      createdAt: new Date().toISOString(),
    };
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(orderWithTimestamp));
  }

  static getOrder(): SessionOrder | null {
    const stored = sessionStorage.getItem(this.SESSION_KEY);
    if (!stored) return null;

    try {
      const order = JSON.parse(stored);
      
      // Check if order is expired (older than 4 hours)
      const createdAt = new Date(order.createdAt);
      const now = new Date();
      const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > this.EXPIRY_HOURS) {
        this.clearOrder();
        return null;
      }
      
      return order;
    } catch {
      return null;
    }
  }

  static updateOrderItems(items: any[]): void {
    const current = this.getOrder();
    if (current) {
      current.items = items;
      this.saveOrder(current);
    }
  }

  static clearOrder(): void {
    sessionStorage.removeItem(this.SESSION_KEY);
  }

  static hasActiveOrder(): boolean {
    return this.getOrder() !== null;
  }
}