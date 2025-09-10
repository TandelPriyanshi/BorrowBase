import bcrypt from "bcryptjs";
import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { Resource } from "../entities/Resource";
import { BorrowRequest } from "../entities/BorrowRequest";
import { Review } from "../entities/Review";
import { JWTService } from "../utils/jwt";
import { RegisterRequest, UserUpdateData } from "../types/auth";

export class UserService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * Register a new user
   */
  async register(userData: RegisterRequest): Promise<{
    user: Omit<User, "password" | "refresh_token">;
    accessToken: string;
    refreshToken: string;
  }> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: userData.email }
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Create user
    const user = this.userRepository.create({
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      address: userData.address,
      latitude: userData.latitude,
      longitude: userData.longitude,
      // Set default values
      is_active: true,
      is_email_verified: false,
      is_location_verified: false,
      verification_status: "pending",
      average_rating: 0,
      total_ratings: 0,
      items_shared: 0,
      successful_borrows: 0
    });

    // Save user
    const savedUser = await this.userRepository.save(user);

    // Generate tokens
    const { accessToken, refreshToken } = JWTService.generateTokenPair(savedUser);

    // Save refresh token to user
    savedUser.refresh_token = refreshToken;
    savedUser.last_login = new Date();
    await this.userRepository.save(savedUser);

    // Return user without sensitive data
    const { password, refresh_token, ...userResponse } = savedUser;
    
    return {
      user: userResponse,
      accessToken,
      refreshToken
    };
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<{
    user: Omit<User, "password" | "refresh_token">;
    accessToken: string;
    refreshToken: string;
  }> {
    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email }
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Check if user is active
    if (!user.is_active) {
      throw new Error("Account is deactivated");
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    // Generate new tokens
    const { accessToken, refreshToken } = JWTService.generateTokenPair(user);

    // Update user with refresh token and last login
    user.refresh_token = refreshToken;
    user.last_login = new Date();
    await this.userRepository.save(user);

    // Return user without sensitive data
    const { password: _, refresh_token, ...userResponse } = user;
    
    return {
      user: userResponse,
      accessToken,
      refreshToken
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    // Verify refresh token
    let decoded;
    try {
      decoded = JWTService.verifyRefreshToken(refreshToken);
    } catch (error: any) {
      throw new Error("Invalid refresh token");
    }

    // Find user and verify refresh token
    const user = await this.userRepository.findOne({
      where: { id: decoded.id }
    });

    if (!user || user.refresh_token !== refreshToken) {
      throw new Error("Invalid refresh token");
    }

    if (!user.is_active) {
      throw new Error("Account is deactivated");
    }

    // Generate new tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = JWTService.generateTokenPair(user);

    // Update user with new refresh token
    user.refresh_token = newRefreshToken;
    await this.userRepository.save(user);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id }
    });
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: number, updateData: UserUpdateData): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Update user fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof UserUpdateData] !== undefined) {
        (user as any)[key] = updateData[key as keyof UserUpdateData];
      }
    });

    // If location is being updated, mark as verified if both lat/lng are provided
    if (updateData.latitude && updateData.longitude) {
      user.is_location_verified = true;
    }

    return this.userRepository.save(user);
  }

  /**
   * Logout user (invalidate refresh token)
   */
  async logout(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (user) {
      user.refresh_token = undefined;
      await this.userRepository.save(user);
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;

    // Invalidate all refresh tokens
    user.refresh_token = undefined;

    await this.userRepository.save(user);
  }

  /**
   * Verify user email
   */
  async verifyEmail(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new Error("User not found");
    }

    user.is_email_verified = true;
    if (user.verification_status === "pending") {
      user.verification_status = "verified";
    }

    await this.userRepository.save(user);
  }

  /**
   * Update user rating
   */
  async updateRating(userId: number, newRating: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Calculate new average rating
    const totalRatings = user.total_ratings + 1;
    const totalScore = (user.average_rating * user.total_ratings) + newRating;
    const averageRating = totalScore / totalRatings;

    user.average_rating = parseFloat(averageRating.toFixed(2));
    user.total_ratings = totalRatings;

    await this.userRepository.save(user);
  }

  /**
   * Increment successful borrow count
   */
  async incrementSuccessfulBorrows(userId: number): Promise<void> {
    await this.userRepository.increment(
      { id: userId },
      "successful_borrows",
      1
    );
  }

  /**
   * Increment items shared count
   */
  async incrementItemsShared(userId: number): Promise<void> {
    await this.userRepository.increment(
      { id: userId },
      "items_shared",
      1
    );
  }

  /**
   * Get complete profile data with resources, borrow history, and reviews
   */
  async getCompleteProfile(userId: number): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Get user's resources
    const resourceRepository = AppDataSource.getRepository(Resource);
    const resources = await resourceRepository.find({
      where: { owner_id: userId },
      relations: ['photos'],
      order: { created_at: 'DESC' }
    });

    // Get user's borrow requests (both as borrower and lender)
    const borrowRequestRepository = AppDataSource.getRepository(BorrowRequest);
    const borrowRequests = await borrowRequestRepository.find({
      where: { requester_id: userId },
      relations: ['resource', 'resource.owner', 'resource.photos'],
      order: { created_at: 'DESC' }
    });

    const lendRequests = await borrowRequestRepository
      .createQueryBuilder('br')
      .leftJoinAndSelect('br.resource', 'resource')
      .leftJoinAndSelect('br.requester', 'requester')
      .leftJoinAndSelect('resource.photos', 'photos')
      .where('resource.owner_id = :userId', { userId })
      .orderBy('br.created_at', 'DESC')
      .getMany();

    // Get user's reviews (received and given)
    const reviewRepository = AppDataSource.getRepository(Review);
    const receivedReviews = await reviewRepository.find({
      where: { reviewee_id: userId },
      relations: ['reviewer'],
      order: { created_at: 'DESC' }
    });

    const givenReviews = await reviewRepository.find({
      where: { reviewer_id: userId },
      relations: ['reviewee'],
      order: { created_at: 'DESC' }
    });

    // Filter borrow history to exclude rejected and cancelled requests for display
    const displayableBorrowHistory = borrowRequests.filter(req => 
      req.status !== 'rejected' && req.status !== 'cancelled'
    );
    
    // Calculate statistics
    // Borrow count should match what's displayed in the borrow tab
    const borrowCount = displayableBorrowHistory.length;
    const lendCount = resources.length; // All user's resources are available for lending
    const exchangeCount = 0; // We'll implement exchange logic later if needed
    
    // Count successful/meaningful borrows for additional statistics
    const successfulBorrows = borrowRequests.filter(req => 
      req.status === 'approved' || req.status === 'active' || req.status === 'returned' || req.status === 'completed'
    ).length;
    
    // Remove sensitive data from user
    const { password, refresh_token, ...userProfile } = user;

    return {
      user: userProfile,
      statistics: {
        borrowCount, // This now matches what's displayed
        lendCount,
        exchangeCount,
        totalResources: resources.length,
        successfulBorrows, // Additional stat for successful borrows
        completedBorrows: borrowRequests.filter(req => req.status === 'completed').length,
        completedLends: lendRequests.filter(req => req.status === 'completed').length,
        averageRating: user.average_rating,
        totalRatings: user.total_ratings
      },
      resources: {
        lend: resources, // All resources are available for lending
        exchange: [] // Exchange functionality to be implemented
      },
      borrowHistory: displayableBorrowHistory, // Only show meaningful requests
      lendHistory: lendRequests,
      reviews: {
        received: receivedReviews,
        given: givenReviews
      }
    };
  }
}
