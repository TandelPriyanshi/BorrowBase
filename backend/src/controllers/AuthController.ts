import { Request, Response } from "express";
import { UserService } from "../services/UserService";
import {
  AuthenticatedRequest,
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  UpdateProfileRequest,
  AuthResponse,
  ProfileResponse,
  RefreshTokenResponse,
  ApiResponse
} from "../types/auth";

export class AuthController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(req: Request<{}, AuthResponse, RegisterRequest>, res: Response<AuthResponse>): Promise<void> {
    try {
      const { name, email, password, address, latitude, longitude } = req.body;

      // Validation
      if (!name || !email || !password) {
        res.status(400).json({
          user: {} as any,
          accessToken: "",
          refreshToken: "",
          message: "Name, email, and password are required",
          success: false,
        });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({
          user: {} as any,
          accessToken: "",
          refreshToken: "",
          message: "Password must be at least 6 characters long",
          success: false,
        });
        return;
      }

      // Register user
      const result = await this.userService.register({
        name,
        email,
        password,
        address,
        latitude,
        longitude,
      });

      res.status(201).json({
        ...result,
        message: "User registered successfully",
        success: true,
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({
        user: {} as any,
        accessToken: "",
        refreshToken: "",
        message: error.message || "Registration failed",
        success: false,
      });
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req: Request<{}, AuthResponse, LoginRequest>, res: Response<AuthResponse>): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        res.status(400).json({
          user: {} as any,
          accessToken: "",
          refreshToken: "",
          message: "Email and password are required",
          success: false,
        });
        return;
      }

      // Login user
      const result = await this.userService.login(email, password);

      res.json({
        ...result,
        message: "Login successful",
        success: true,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(401).json({
        user: {} as any,
        accessToken: "",
        refreshToken: "",
        message: error.message || "Invalid credentials",
        success: false,
      });
    }
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  async refreshToken(req: Request<{}, RefreshTokenResponse, RefreshTokenRequest>, res: Response<RefreshTokenResponse>): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          data: { accessToken: "", refreshToken: "" },
          success: false,
        });
        return;
      }

      const result = await this.userService.refreshToken(refreshToken);

      res.json({
        data: result,
        success: true,
      });
    } catch (error: any) {
      console.error("Token refresh error:", error);
      res.status(401).json({
        data: { accessToken: "", refreshToken: "" },
        success: false,
      });
    }
  }

  /**
   * Get user profile
   * GET /api/profile
   */
  async getProfile(req: AuthenticatedRequest, res: Response<ProfileResponse>): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          data: {} as any,
          success: false,
        });
        return;
      }

      // Remove sensitive data
      const { password, refresh_token, ...userData } = req.user;

      res.json({
        data: userData,
        success: true,
      });
    } catch (error: any) {
      console.error("Get profile error:", error);
      res.status(500).json({
        data: {} as any,
        success: false,
      });
    }
  }

  /**
   * Update user profile
   * PUT /api/profile
   */
  async updateProfile(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          message: "User not authenticated",
          success: false,
        });
        return;
      }

      const { name, address, latitude, longitude, bio, phone } = req.body;

      const updatedUser = await this.userService.updateProfile(req.user.id, {
        name,
        address,
        latitude,
        longitude,
        bio,
        phone,
      });

      const { password, refresh_token, ...userData } = updatedUser;

      res.json({
        data: userData,
        message: "Profile updated successfully",
        success: true,
      });
    } catch (error: any) {
      console.error("Update profile error:", error);
      res.status(500).json({
        message: error.message || "Failed to update profile",
        success: false,
      });
    }
  }

  /**
   * Update location (same as updateProfile but specific endpoint)
   * POST /api/update-location
   */
  async updateLocation(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          message: "User not authenticated",
          success: false,
        });
        return;
      }

      const { latitude, longitude, address } = req.body;

      if (!latitude || !longitude) {
        res.status(400).json({
          message: "Latitude and longitude are required",
          success: false,
        });
        return;
      }

      const updatedUser = await this.userService.updateProfile(req.user.id, {
        latitude,
        longitude,
        address,
        is_location_verified: true,
      });

      const { password, refresh_token, ...userData } = updatedUser;

      res.json({
        data: userData,
        message: "Location updated successfully",
        success: true,
      });
    } catch (error: any) {
      console.error("Update location error:", error);
      res.status(500).json({
        message: error.message || "Failed to update location",
        success: false,
      });
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  async logout(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          message: "User not authenticated",
          success: false,
        });
        return;
      }

      await this.userService.logout(req.user.id);

      res.json({
        message: "Logged out successfully",
        success: true,
      });
    } catch (error: any) {
      console.error("Logout error:", error);
      res.status(500).json({
        message: error.message || "Logout failed",
        success: false,
      });
    }
  }

  /**
   * Change password
   * POST /api/auth/change-password
   */
  async changePassword(req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          message: "User not authenticated",
          success: false,
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          message: "Current password and new password are required",
          success: false,
        });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({
          message: "New password must be at least 6 characters long",
          success: false,
        });
        return;
      }

      await this.userService.changePassword(req.user.id, currentPassword, newPassword);

      res.json({
        message: "Password changed successfully",
        success: true,
      });
    } catch (error: any) {
      console.error("Change password error:", error);
      res.status(400).json({
        message: error.message || "Failed to change password",
        success: false,
      });
    }
  }

  /**
   * Get comprehensive profile data
   * GET /api/profile/complete
   */
  async getCompleteProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          message: "User not authenticated",
          success: false,
        });
        return;
      }

      const completeProfile = await this.userService.getCompleteProfile(req.user.id);
      
      res.json({
        data: completeProfile,
        success: true,
      });
    } catch (error: any) {
      console.error("Get complete profile error:", error);
      res.status(500).json({
        message: error.message || "Failed to get complete profile",
        success: false,
      });
    }
  }
}
