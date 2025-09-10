import { Response, NextFunction } from "express";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { AuthenticatedRequest, ApiResponse } from "../types/auth";
import { JWTService } from "../utils/jwt";

/**
 * Middleware to authenticate requests using JWT tokens
 * Extracts user from token and attaches to request object
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const token = JWTService.extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      res.status(401).json({
        message: "Access token required",
        success: false
      });
      return;
    }

    // Verify the token
    let decoded;
    try {
      decoded = JWTService.verifyAccessToken(token);
    } catch (error: any) {
      res.status(401).json({
        message: error.message || "Invalid or expired token",
        success: false
      });
      return;
    }

    // Get user from database
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: decoded.id }
    });

    if (!user) {
      res.status(401).json({
        message: "User not found",
        success: false
      });
      return;
    }

    // Check if user is active
    if (!user.is_active) {
      res.status(401).json({
        message: "Account is deactivated",
        success: false
      });
      return;
    }

    // Attach user to request object
    req.user = user;
    next();

  } catch (error: any) {
    console.error("Authentication middleware error:", error);
    res.status(500).json({
      message: "Internal server error during authentication",
      success: false
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 * Used for endpoints that work with both authenticated and anonymous users
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = JWTService.extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      // No token provided, continue without user
      next();
      return;
    }

    try {
      const decoded = JWTService.verifyAccessToken(token);
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: decoded.id }
      });

      if (user && user.is_active) {
        req.user = user;
      }
    } catch (error) {
      // Token invalid, continue without user
      console.warn("Optional auth token invalid:", error);
    }

    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    next(); // Continue even if there's an error
  }
};

/**
 * Middleware to check if user is verified
 * Should be used after authenticateToken
 */
export const requireVerified = (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      message: "Authentication required",
      success: false
    });
    return;
  }

  if (req.user.verification_status !== "verified") {
    res.status(403).json({
      message: "Account verification required",
      success: false
    });
    return;
  }

  next();
};

/**
 * Middleware to check if user has verified their location
 * Should be used after authenticateToken
 */
export const requireLocationVerified = (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      message: "Authentication required",
      success: false
    });
    return;
  }

  if (!req.user.is_location_verified) {
    res.status(403).json({
      message: "Location verification required",
      success: false
    });
    return;
  }

  next();
};
