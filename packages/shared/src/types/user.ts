export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  avatarUrl: string;
}
