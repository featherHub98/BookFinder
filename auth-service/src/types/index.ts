import { Request } from 'express';
import { Types } from 'mongoose';

// User Types
export interface UserWithoutPassword {
  _id: Types.ObjectId;
  email: string;
  name: string | null;
  avatar: string | null;
  role: string;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

// JWT Types
export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

// Request Types
export interface AuthenticatedRequest extends Request {
  user?: UserWithoutPassword;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface AuthResponse {
  user: UserWithoutPassword;
  token: string;
}
