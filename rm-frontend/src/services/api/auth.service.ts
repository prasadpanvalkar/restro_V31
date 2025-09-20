// src/services/api/auth.service.ts
import apiClient from './config';
import { LoginRequest, LoginResponse, User } from '@/types/auth.types';

class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login/', credentials);
    const { token, user } = response.data;
    
    // Store in localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return response.data;
  }

  async refreshToken(): Promise<string> {
    const response = await apiClient.post<{ access: string }>('/auth/token/refresh/');
    const newToken = response.data.access;
    localStorage.setItem('token', newToken);
    return newToken;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export default new AuthService();