
// src/types/auth.types.ts
export type UserRole = 'ADMIN' | 'CHEF' | 'CASHIER' | 'CAPTAIN'| 'CUSTOMER';

export interface User {
  name: string;
  role: UserRole;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}