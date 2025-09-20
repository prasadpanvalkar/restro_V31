// src/services/websocket/WebSocketManager.ts
import { WebSocketMessage, OrderStatusUpdate, CashierNotification } from '@/types/websocket.types';
import { UserRole } from '@/types/auth.types';

type WebSocketCallback = (data: any) => void;

class WebSocketManager {
  private socket: WebSocket | null = null;
  private listeners: Map<string, WebSocketCallback> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private currentConfig: {
    role: UserRole;
    restaurantSlug: string;
    tableNumber?: string;
  } | null = null;

  connect(role: UserRole, restaurantSlug: string, tableNumber?: string): void {
    const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
    let wsUrl: string;

    // Store config for reconnection
    this.currentConfig = { role, restaurantSlug, tableNumber };

    switch (role) {
      case 'CHEF':
        wsUrl = `${WS_BASE_URL}/chef/${restaurantSlug}/`;
        break;
      case 'CASHIER':
        wsUrl = `${WS_BASE_URL}/cashier/${restaurantSlug}/`;
        break;
      default:
        if (tableNumber) {
          wsUrl = `${WS_BASE_URL}/customer/${tableNumber}/${restaurantSlug}/`;
        } else {
          console.error('Table number required for customer WebSocket');
          return;
        }
    }

    this.disconnect(); // Close existing connection if any
    this.socket = new WebSocket(wsUrl);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        this.notifyListeners(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.socket.onerror = (error: Event) => {
      console.error('WebSocket error:', error);
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect();
    };
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    if (!this.currentConfig) return;

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
    
    this.reconnectTimeout = setTimeout(() => {
      const { role, restaurantSlug, tableNumber } = this.currentConfig!;
      this.connect(role, restaurantSlug, tableNumber);
    }, delay);
  }

  addListener(key: string, callback: WebSocketCallback): void {
    this.listeners.set(key, callback);
  }

  removeListener(key: string): void {
    this.listeners.delete(key);
  }

  private notifyListeners(data: any): void {
    this.listeners.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in WebSocket listener:', error);
      }
    });
  }

  send(data: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.listeners.clear();
    this.currentConfig = null;
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}

export default new WebSocketManager();