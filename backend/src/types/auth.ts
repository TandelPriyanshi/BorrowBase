import { Request } from "express";
import { User } from "../entities/User";

// Base interfaces for authentication
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UpdateProfileRequest {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  bio?: string;
  phone?: string;
}

// Response interfaces
export interface AuthResponse {
  user: Omit<User, "password" | "refresh_token">;
  accessToken: string;
  refreshToken: string;
  message: string;
  success: boolean;
}

export interface ProfileResponse {
  data: Omit<User, "password" | "refresh_token">;
  success: boolean;
}

export interface RefreshTokenResponse {
  data: {
    accessToken: string;
    refreshToken: string;
  };
  success: boolean;
}

export interface ApiResponse<T = any> {
  data?: T;
  message: string;
  success: boolean;
}

// JWT Token payload interface
export interface JWTPayload {
  id: number;
  email: string;
  type: "access" | "refresh";
  iat?: number;
  exp?: number;
}

// Extended Request interface with authenticated user
export interface AuthenticatedRequest extends Request {
  user?: User;
}

// User update data type
export interface UserUpdateData {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  bio?: string;
  phone?: string;
  is_email_verified?: boolean;
  is_location_verified?: boolean;
  verification_status?: string;
}
