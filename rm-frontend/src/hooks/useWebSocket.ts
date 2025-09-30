// src/hooks/useWebSocket.ts
import { useEffect, useCallback, useRef } from 'react';
import WebSocketManager from '@/services/websocket/WebSocketManager';
import { UserRole } from '@/types/auth.types';

interface UseWebSocketOptions {
  role: UserRole | 'CUSTOMER';
  restaurantSlug: string;
  billId?: number; // Keep this
  onMessage?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  enabled?: boolean;
}

export const useWebSocket = ({
  role,
  restaurantSlug,
  billId, // FIXED: Use billId instead of tableNumber
  onMessage,
  onConnect,
  onDisconnect,
  onError,
  enabled = true,
}: UseWebSocketOptions) => {
  const callbacksRef = useRef({ onMessage, onConnect, onDisconnect, onError });
  const connectionRef = useRef<{ role: string; slug: string; billId?: number } | null>(null);

  useEffect(() => {
    callbacksRef.current = { onMessage, onConnect, onDisconnect, onError };
  }, [onMessage, onConnect, onDisconnect, onError]);

  useEffect(() => {
    if (!enabled || !restaurantSlug) {
      console.log('WebSocket disabled or missing restaurantSlug');
      return;
    }

    const connectionKey = `${role}-${restaurantSlug}-${billId || ''}`;
    const currentConnection = connectionRef.current;
    const currentConnectionKey = currentConnection 
      ? `${currentConnection.role}-${currentConnection.slug}-${currentConnection.billId || ''}`
      : null;

    if (currentConnectionKey !== connectionKey) {
      console.log('WebSocket connection details changed, reconnecting...');
      
      WebSocketManager.removeListener('hook-listener');
      WebSocketManager.disconnect();
      
      connectionRef.current = { role, slug: restaurantSlug, billId };
      
      // FIXED: Use billId instead of undefined tableNumber
      WebSocketManager.connect(role as UserRole, restaurantSlug, billId);
      
      WebSocketManager.addListener('hook-listener', (data: any) => {
        console.log('WebSocket message received in hook:', data);
        const currentCallbacks = callbacksRef.current;
        if (currentCallbacks.onMessage) {
          try {
            currentCallbacks.onMessage(data);
          } catch (error) {
            console.error('Error in WebSocket onMessage callback:', error);
          }
        }
      });
      
      if (callbacksRef.current.onConnect) {
        callbacksRef.current.onConnect();
      }
    }

    return () => {
      console.log('WebSocket hook cleanup');
      WebSocketManager.removeListener('hook-listener');
    };
  }, [role, restaurantSlug, billId, enabled]); // FIXED: Use billId in dependencies

  useEffect(() => {
    return () => {
      console.log('WebSocket hook unmounting - full cleanup');
      WebSocketManager.removeListener('hook-listener');
      WebSocketManager.disconnect();
      connectionRef.current = null;
    };
  }, []);

  const sendMessage = useCallback((data: any) => {
    WebSocketManager.send(data);
  }, []);

  return { 
    sendMessage, 
    isConnected: WebSocketManager.isConnected(),
    connectionStatus: WebSocketManager.isConnected() ? 'connected' : 'disconnected'
  };
};