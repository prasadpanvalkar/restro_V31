// src/hooks/useWebSocket.ts
import { useEffect, useCallback } from 'react';
import WebSocketManager from '@/services/websocket/WebSocketManager';
import { UserRole } from '@/types/auth.types';

interface UseWebSocketOptions {
  role?: UserRole;
  restaurantSlug?: string;
  tableNumber?: string;
  onMessage?: (data: any) => void;
  // A flag to explicitly enable/disable the connection
  enabled?: boolean; 
}

export const useWebSocket = ({
  role,
  restaurantSlug,
  tableNumber,
  onMessage,
  enabled = true, // Default to enabled
}: UseWebSocketOptions) => {
  useEffect(() => {
    // --- START OF FIX ---
    // Guard Clause: Prevents the hook from trying to connect
    // until all necessary information is available and it's enabled.
    if (!enabled || !role || !restaurantSlug) {
      return; // Don't connect if not enabled or basic info is missing
    }
    if (role === 'CUSTOMER' && !tableNumber) {
      return; // Don't connect if role is customer but table number is missing
    }
    // --- END OF FIX ---

    WebSocketManager.connect(role, restaurantSlug, tableNumber);

    if (onMessage) {
      WebSocketManager.addListener('hook-listener', onMessage);
    }

    // The cleanup function runs when the component unmounts
    // or when the dependencies change, ensuring a clean disconnect.
    return () => {
      WebSocketManager.removeListener('hook-listener');
      WebSocketManager.disconnect();
    };
  }, [role, restaurantSlug, tableNumber, onMessage, enabled]); // Add dependencies

  const sendMessage = useCallback((data: any) => {
    WebSocketManager.send(data);
  }, []);

  const isConnected = WebSocketManager.isConnected();

  return { sendMessage, isConnected };
};