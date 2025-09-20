// src/services/api/menu.service.ts
import apiClient from './config';
import { 
  MenuItem, 
  Category, 
  FoodType, 
  Cuisine, 
  MenuItemCreateRequest,
  PublicMenuItem 
} from '@/types/menu.types';

class MenuService {
  // Restaurant Admin APIs - Menu Items
  async getMenuItems(): Promise<MenuItem[]> {
    const response = await apiClient.get<MenuItem[]>('/restaurant/menu-items/');
    return response.data;
  }

  async createMenuItem(data: MenuItemCreateRequest): Promise<MenuItem> {
    const response = await apiClient.post<MenuItem>('/restaurant/menu-items/', data);
    return response.data;
  }

  async updateMenuItem(id: number, data: Partial<MenuItemCreateRequest>): Promise<MenuItem> {
    const response = await apiClient.put<MenuItem>(`/restaurant/menu-items/${id}/`, data);
    return response.data;
  }

  async deleteMenuItem(id: number): Promise<void> {
    await apiClient.delete(`/restaurant/menu-items/${id}/`);
  }

  // Category Management (Restaurant-specific)
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>('/restaurant/categories/');
    return response.data;
  }

  async createCategory(name: string): Promise<Category> {
    const response = await apiClient.post<Category>('/restaurant/categories/', { name });
    return response.data;
  }

  async updateCategory(id: number, name: string): Promise<Category> {
    const response = await apiClient.put<Category>(`/restaurant/categories/${id}/`, { name });
    return response.data;
  }

  async deleteCategory(id: number): Promise<void> {
    await apiClient.delete(`/restaurant/categories/${id}/`);
  }

  // Food Type Management (Global)
  async getFoodTypes(): Promise<FoodType[]> {
    const response = await apiClient.get<FoodType[]>('/restaurant/food-types/');
    return response.data;
  }

  async createFoodType(name: string): Promise<FoodType> {
    const response = await apiClient.post<FoodType>('/restaurant/food-types/', { name });
    return response.data;
  }

  async updateFoodType(id: number, name: string): Promise<FoodType> {
    const response = await apiClient.put<FoodType>(`/restaurant/food-types/${id}/`, { name });
    return response.data;
  }

  async deleteFoodType(id: number): Promise<void> {
    await apiClient.delete(`/restaurant/food-types/${id}/`);
  }

  // Cuisine Management (Global)
  async getCuisines(): Promise<Cuisine[]> {
    const response = await apiClient.get<Cuisine[]>('/restaurant/cuisines/');
    return response.data;
  }

  async createCuisine(name: string): Promise<Cuisine> {
    const response = await apiClient.post<Cuisine>('/restaurant/cuisines/', { name });
    return response.data;
  }

  async updateCuisine(id: number, name: string): Promise<Cuisine> {
    const response = await apiClient.put<Cuisine>(`/restaurant/cuisines/${id}/`, { name });
    return response.data;
  }

  async deleteCuisine(id: number): Promise<void> {
    await apiClient.delete(`/restaurant/cuisines/${id}/`);
  }

  // Public APIs
  async getPublicMenu(restaurantSlug: string): Promise<PublicMenuItem[]> {
    const response = await apiClient.get<PublicMenuItem[]>(
      `/restaurants/${restaurantSlug}/menu/`
    );
    return response.data;
  }
}

export default new MenuService();