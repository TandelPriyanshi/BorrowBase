import jwt from "jsonwebtoken";
import { User } from "../entities/User";
import { JWTPayload } from "../types/auth";

export class JWTService {
  private static readonly ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || "your-super-secret-access-key";
  private static readonly REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || "your-super-secret-refresh-key";
  private static readonly ACCESS_TOKEN_EXPIRY = "15m";
  private static readonly REFRESH_TOKEN_EXPIRY = "7d";

  /**
   * Generate access token for user
   */
  static generateAccessToken(user: User): string {
    const payload: Omit<JWTPayload, "iat" | "exp"> = {
      id: user.id,
      email: user.email,
      type: "access"
    };

    return jwt.sign(payload, this.ACCESS_TOKEN_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY
    });
  }

  /**
   * Generate refresh token for user
   */
  static generateRefreshToken(user: User): string {
    const payload: Omit<JWTPayload, "iat" | "exp"> = {
      id: user.id,
      email: user.email,
      type: "refresh"
    };

    return jwt.sign(payload, this.REFRESH_TOKEN_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY
    });
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.ACCESS_TOKEN_SECRET) as JWTPayload;
      
      if (decoded.type !== "access") {
        throw new Error("Invalid token type");
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("Invalid access token");
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("Access token expired");
      }
      throw error;
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.REFRESH_TOKEN_SECRET) as JWTPayload;
      
      if (decoded.type !== "refresh") {
        throw new Error("Invalid token type");
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("Invalid refresh token");
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("Refresh token expired");
      }
      throw error;
    }
  }

  /**
   * Generate both tokens for user
   */
  static generateTokenPair(user: User): { accessToken: string; refreshToken: string } {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user)
    };
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return null;
    }

    return parts[1];
  }
}
