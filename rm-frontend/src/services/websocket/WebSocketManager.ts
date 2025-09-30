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
    restaurantSlug?: string;
    billId?: number; // Changed from tableNumber
  } | null = null;

  // Updated the parameter to accept billId
  connect(role: UserRole, restaurantSlug?: string, billId?: number): void {
    const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
    let wsUrl: string;

    // Store config for reconnection
    this.currentConfig = { role, restaurantSlug, billId };

    switch (role) {
      case 'CHEF':
        wsUrl = `${WS_BASE_URL}/chef/${restaurantSlug}/`;
        break;
      case 'CASHIER':
        wsUrl = `${WS_BASE_URL}/cashier/${restaurantSlug}/`;
        break;
      case 'CUSTOMER': // Explicitly handle CUSTOMER role
        if (billId) {
          // --- THIS IS THE FIX ---
          // The URL now correctly uses bill_id, matching your backend routing
          wsUrl = `${WS_BASE_URL}/customer/${billId}/`;
        } else {
          console.error('Bill ID is required for customer WebSocket');
          return;
        }
        break;
      default:
        console.error('Invalid role for WebSocket connection');
        return;
    }

    this.disconnect(); // Ensure any old connection is closed
    this.socket = new WebSocket(wsUrl);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      console.log('✅ WebSocket connected to:', this.socket?.url);
      this.reconnectAttempts = 0;
    };

    this.socket.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 WebSocket raw message received:', data); // 🔥 ADD: Debug logging
        this.notifyListeners(data);
      } catch (error) {
        console.error('❌ Failed to parse WebSocket message:', error, 'Raw:', event.data);
      }
    };

    this.socket.onerror = (error: Event) => {
      console.error('❌ WebSocket error:', error);
    };

    this.socket.onclose = (event: CloseEvent) => {
      console.log('🔌 WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
      this.attemptReconnect();
    };
  }

  // private notifyListeners(data: any): void {
  //   console.log('📢 Notifying', this.listeners.size, 'WebSocket listeners with data:', data);
  //   this.listeners.forEach((callback, key) => {
  //     try {
  //       console.log('📤 Calling listener:', key);
  //       callback(data);
  //     } catch (error) {
  //       console.error('❌ Error in WebSocket listener', key, ':', error);
  //     }
  //   });
  // }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts || !this.currentConfig) {
        return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
    
    this.reconnectTimeout = setTimeout(() => {
      const { role, restaurantSlug, billId } = this.currentConfig!;
      this.connect(role, restaurantSlug, billId);
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
      // Remove event listeners before closing to prevent reconnect attempts on manual disconnect
      this.socket.onclose = null; 
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