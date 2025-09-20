// src/types/menu.types.ts
export interface MenuItemVariant {
  variant_name: string;
  price: number;
  preparation_time: number;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  category: number;
  is_available: boolean;
  food_types: number[];
  cuisines: number[];
  variants: MenuItemVariant[];
}

export interface Category {
  id: number;
  name: string;
}

export interface FoodType {
  id: number;
  name: string;
}

export interface Cuisine {
  id: number;
  name: string;
}

export interface PublicMenuItem {
  id: number;
  name: string;
  description: string;
  food_types: string[];
  cuisines: string[];
  variants: MenuItemVariant[];
}

export interface MenuItemCreateRequest {
  name: string;
  description: string;
  category: number;
  is_available: boolean;
  food_types: number[];
  cuisines: number[];
  variants: MenuItemVariant[];
}