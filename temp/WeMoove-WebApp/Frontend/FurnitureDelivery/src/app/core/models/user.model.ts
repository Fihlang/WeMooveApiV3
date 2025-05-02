export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address?: string;
  avatarUrl?: string;
  createdAt: Date;
  isVerified: boolean;
  userType: 'customer' | 'driver' | 'admin';
}

export interface AuthResponse {
  user: User;
  token?: string; // JWT token for authentication
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phoneNumber: string;
  address?: string;
  userType?: string;
}