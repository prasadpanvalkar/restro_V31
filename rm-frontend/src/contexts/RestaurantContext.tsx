// src/contexts/RestaurantContext.tsx
import React, { createContext, useContext } from 'react';

interface RestaurantContextType {
  restaurantSlug: string;
  restaurantId: number;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within RestaurantProvider');
  }
  return context;
};

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  
  // Extract restaurant info from JWT token
  const restaurantId = token ? JSON.parse(atob(token.split('.')[1])).restaurant_id : null;
  
  // You might need to fetch restaurant slug from an API
  const restaurantSlug = 'test-restaurant'; // This should be fetched based on restaurantId
  
  return (
    <RestaurantContext.Provider value={{ restaurantSlug, restaurantId }}>
      {children}
    </RestaurantContext.Provider>
  );
};