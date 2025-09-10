import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { Review } from "../entities/Review";
import { User } from "../entities/User";
import { BorrowRequest } from "../entities/BorrowRequest";
import {
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ConflictError,
} from "../utils/errors";
import { NotificationService } from "./NotificationService";

export interface ReviewCreateData {
    reviewer_id: number;
    reviewee_id: number;
    borrow_request_id?: number;
    rating: number;
    comment?: string;
    review_type: "borrower_to_owner" | "owner_to_borrower";
    communication_rating?: number;
    reliability_rating?: number;
    item_condition_rating?: number;
    care_rating?: number;
    is_anonymous?: boolean;
}

export interface ReviewStats {
    reviews: Review[];
    averageRating: number;
    totalReviews: number;
    ratingBreakdown: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
    categoryRatings?: {
        communication: number;
        reliability: number;
        itemCondition: number;
        care: number;
    };
}

export class ReviewService {
    private reviewRepository: Repository<Review>;
    private userRepository: Repository<User>;
    private borrowRequestRepository: Repository<BorrowRequest>;
    private notificationService: NotificationService;

    constructor() {
        this.reviewRepository = AppDataSource.getRepository(Review);
        this.userRepository = AppDataSource.getRepository(User);
        this.borrowRequestRepository =
            AppDataSource.getRepository(BorrowRequest);
        this.notificationService = new NotificationService();
    }

    /**
     * Create a new review
     */
    async createReview(data: ReviewCreateData): Promise<Review> {
        // Basic validation
        if (data.reviewer_id === data.reviewee_id) {
            throw new ValidationError("Cannot review yourself");
        }

        if (data.rating < 1 || data.rating > 5) {
            throw new ValidationError("Rating must be between 1 and 5");
        }

        // Validate category ratings if provided
        const categoryRatings = [
            data.communication_rating,
            data.reliability_rating,
            data.item_condition_rating,
            data.care_rating,
        ];

        for (const rating of categoryRatings) {
            if (rating !== undefined && (rating < 1 || rating > 5)) {
                throw new ValidationError(
                    "Category ratings must be between 1 and 5"
                );
            }
        }

        // Check if borrow request exists and is completed (only if provided)
        let isRequester = false;
        let isOwner = false;

        if (data.borrow_request_id) {
            const borrowRequest = await this.borrowRequestRepository.findOne({
                where: { id: data.borrow_request_id },
                relations: ["resource", "resource.owner", "requester"],
            });

            if (!borrowRequest) {
                throw new NotFoundError("Borrow request");
            }

            if (!["returned", "completed"].includes(borrowRequest.status)) {
                throw new ConflictError(
                    "Can only review completed transactions"
                );
            }

            // Validate reviewer is part of the transaction
            isRequester = borrowRequest.requester_id === data.reviewer_id;
            isOwner = borrowRequest.resource?.owner_id === data.reviewer_id;

            if (!isRequester && !isOwner) {
                throw new UnauthorizedError(
                    "Only participants in the transaction can leave reviews"
                );
            }

            // Validate reviewee is the other party
            const expectedRevieweeId = isRequester
                ? borrowRequest.resource?.owner_id
                : borrowRequest.requester_id;
            if (data.reviewee_id !== expectedRevieweeId) {
                throw new ValidationError(
                    "Invalid reviewee for this transaction"
                );
            }
        }

        // Validate review type matches reviewer role (only if borrow request provided)
        if (data.borrow_request_id) {
            const expectedReviewType = isRequester
                ? "borrower_to_owner"
                : "owner_to_borrower";
            if (data.review_type !== expectedReviewType) {
                throw new ValidationError(
                    "Review type doesn't match reviewer role"
                );
            }
        }

        // Check if review already exists for this transaction and reviewer
        const whereCondition: any = {
            reviewer_id: data.reviewer_id,
            reviewee_id: data.reviewee_id,
        };

        if (data.borrow_request_id) {
            whereCondition.borrow_request_id = data.borrow_request_id;
        } else {
            whereCondition.borrow_request_id = null;
        }

        const existingReview = await this.reviewRepository.findOne({
            where: whereCondition,
        });

        if (existingReview) {
            throw new ConflictError(
                "Review already exists for this transaction"
            );
        }

        // Create the review
        const review = this.reviewRepository.create({
            ...data,
            is_anonymous: data.is_anonymous || false,
            is_verified: false, // Admin can verify later
        });

        const savedReview = await this.reviewRepository.save(review);

        // Update user's average rating
        await this.updateUserRating(data.reviewee_id);

        // Create notification for reviewee
        try {
            await this.notificationService.createReviewNotification(
                data.reviewee_id,
                "received",
                savedReview.id,
                data.reviewer_id,
                data.rating
            );
        } catch (error) {
            console.warn("Failed to create review notification:", error);
            // Don't fail the review if notification creation fails
        }

        // Return with relations
        return (await this.reviewRepository.findOne({
            where: { id: savedReview.id },
            relations: [
                "reviewer",
                "reviewee",
                "borrow_request",
                "borrow_request.resource",
            ],
        })) as Review;
    }

    /**
     * Get reviews for a specific user (as reviewee)
     */
    async getUserReviews(
        userId: number,
        page: number = 1,
        limit: number = 10,
        reviewType?: string
    ): Promise<ReviewStats> {
        const queryBuilder = this.reviewRepository
            .createQueryBuilder("review")
            .leftJoinAndSelect("review.reviewer", "reviewer")
            .leftJoinAndSelect("review.borrow_request", "borrowRequest")
            .leftJoinAndSelect("borrowRequest.resource", "resource")
            .where("review.reviewee_id = :userId", { userId })
            .andWhere("review.is_hidden = :isHidden", { isHidden: false })
            .orderBy("review.created_at", "DESC");

        if (reviewType) {
            queryBuilder.andWhere("review.review_type = :reviewType", {
                reviewType,
            });
        }

        const [reviews, totalReviews] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        // Calculate average rating and breakdown
        let totalRating = 0;
        const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let totalCommunication = 0;
        let totalReliability = 0;
        let totalItemCondition = 0;
        let totalCare = 0;
        let communicationCount = 0;
        let reliabilityCount = 0;
        let itemConditionCount = 0;
        let careCount = 0;

        reviews.forEach((review) => {
            totalRating += review.rating;
            const roundedRating = Math.round(
                review.rating
            ) as keyof typeof ratingBreakdown;
            ratingBreakdown[roundedRating]++;

            if (review.communication_rating) {
                totalCommunication += review.communication_rating;
                communicationCount++;
            }
            if (review.reliability_rating) {
                totalReliability += review.reliability_rating;
                reliabilityCount++;
            }
            if (review.item_condition_rating) {
                totalItemCondition += review.item_condition_rating;
                itemConditionCount++;
            }
            if (review.care_rating) {
                totalCare += review.care_rating;
                careCount++;
            }
        });

        const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

        const categoryRatings = {
            communication:
                communicationCount > 0
                    ? totalCommunication / communicationCount
                    : 0,
            reliability:
                reliabilityCount > 0 ? totalReliability / reliabilityCount : 0,
            itemCondition:
                itemConditionCount > 0
                    ? totalItemCondition / itemConditionCount
                    : 0,
            care: careCount > 0 ? totalCare / careCount : 0,
        };

        return {
            reviews,
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews,
            ratingBreakdown,
            categoryRatings,
        };
    }

    /**
     * Get reviews written by a specific user (as reviewer)
     */
    async getReviewsByUser(
        userId: number,
        page: number = 1,
        limit: number = 10
    ): Promise<{ reviews: Review[]; total: number }> {
        const [reviews, total] = await this.reviewRepository.findAndCount({
            where: { reviewer_id: userId },
            relations: [
                "reviewee",
                "borrow_request",
                "borrow_request.resource",
            ],
            order: { created_at: "DESC" },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { reviews, total };
    }

    /**
     * Get a specific review by ID
     */
    async getReviewById(id: number, userId?: number): Promise<Review> {
        const review = await this.reviewRepository.findOne({
            where: { id },
            relations: [
                "reviewer",
                "reviewee",
                "borrow_request",
                "borrow_request.resource",
            ],
        });

        if (!review) {
            throw new NotFoundError("Review");
        }

        // Check if user has access to this review
        if (
            userId &&
            review.reviewer_id !== userId &&
            review.reviewee_id !== userId &&
            !review.is_anonymous
        ) {
            // Only reviewer, reviewee, or public (if not anonymous) can view
        }

        return review;
    }

    /**
     * Update a review (only by the reviewer within edit window)
     */
    async updateReview(
        reviewId: number,
        userId: number,
        data: {
            rating?: number;
            comment?: string;
            communication_rating?: number;
            reliability_rating?: number;
            item_condition_rating?: number;
            care_rating?: number;
        }
    ): Promise<Review> {
        const review = await this.reviewRepository.findOne({
            where: { id: reviewId },
            relations: ["reviewee"],
        });

        if (!review) {
            throw new NotFoundError("Review");
        }

        if (review.reviewer_id !== userId) {
            throw new UnauthorizedError(
                "Only the reviewer can update this review"
            );
        }

        // Check if review is within edit window (e.g., 24 hours)
        const editWindow = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const now = new Date();
        const reviewAge = now.getTime() - review.created_at.getTime();

        if (reviewAge > editWindow) {
            throw new ConflictError(
                "Review can no longer be edited (24 hour window expired)"
            );
        }

        // Validate ratings if provided
        if (data.rating && (data.rating < 1 || data.rating > 5)) {
            throw new ValidationError("Rating must be between 1 and 5");
        }

        const categoryRatings = [
            data.communication_rating,
            data.reliability_rating,
            data.item_condition_rating,
            data.care_rating,
        ];

        for (const rating of categoryRatings) {
            if (rating !== undefined && (rating < 1 || rating > 5)) {
                throw new ValidationError(
                    "Category ratings must be between 1 and 5"
                );
            }
        }

        // Update the review
        const updateData: Partial<Review> = {
            ...data,
        };

        await this.reviewRepository.update(reviewId, updateData);

        // Update user's average rating if main rating changed
        if (data.rating && data.rating !== review.rating) {
            await this.updateUserRating(review.reviewee_id);
        }

        return (await this.reviewRepository.findOne({
            where: { id: reviewId },
            relations: [
                "reviewer",
                "reviewee",
                "borrow_request",
                "borrow_request.resource",
            ],
        })) as Review;
    }

    /**
     * Add a response to a review (by the reviewee)
     */
    async addReviewResponse(
        reviewId: number,
        userId: number,
        response: string
    ): Promise<Review> {
        const review = await this.reviewRepository.findOne({
            where: { id: reviewId },
        });

        if (!review) {
            throw new NotFoundError("Review");
        }

        if (review.reviewee_id !== userId) {
            throw new UnauthorizedError(
                "Only the reviewee can respond to this review"
            );
        }

        if (review.response) {
            throw new ConflictError("Review already has a response");
        }

        if (!response || response.trim().length === 0) {
            throw new ValidationError("Response cannot be empty");
        }

        if (response.length > 1000) {
            throw new ValidationError("Response cannot exceed 1000 characters");
        }

        await this.reviewRepository.update(reviewId, {
            response: response.trim(),
            response_at: new Date(),
        });

        return (await this.reviewRepository.findOne({
            where: { id: reviewId },
            relations: [
                "reviewer",
                "reviewee",
                "borrow_request",
                "borrow_request.resource",
            ],
        })) as Review;
    }

    /**
     * Flag a review for moderation
     */
    async flagReview(
        reviewId: number,
        userId: number,
        reason: string
    ): Promise<void> {
        const review = await this.reviewRepository.findOne({
            where: { id: reviewId },
        });

        if (!review) {
            throw new NotFoundError("Review");
        }

        if (review.reviewer_id === userId) {
            throw new ValidationError("Cannot flag your own review");
        }

        if (!reason || reason.trim().length === 0) {
            throw new ValidationError("Flag reason is required");
        }

        await this.reviewRepository.update(reviewId, {
            is_flagged: true,
            flag_reason: reason.trim(),
        });
    }

    /**
     * Vote on review helpfulness
     */
    async voteOnReview(
        reviewId: number,
        userId: number,
        isHelpful: boolean
    ): Promise<Review> {
        const review = await this.reviewRepository.findOne({
            where: { id: reviewId },
        });

        if (!review) {
            throw new NotFoundError("Review");
        }

        if (review.reviewer_id === userId || review.reviewee_id === userId) {
            throw new ValidationError(
                "Cannot vote on reviews you're involved in"
            );
        }

        // In a full implementation, you'd track individual votes to prevent double voting
        // For now, we'll just increment the counters
        const updateData = {
            total_votes: review.total_votes + 1,
            helpful_votes: isHelpful
                ? review.helpful_votes + 1
                : review.helpful_votes,
        };

        await this.reviewRepository.update(reviewId, updateData);

        return (await this.reviewRepository.findOne({
            where: { id: reviewId },
        })) as Review;
    }

    /**
     * Get pending reviews for a user (transactions they can review)
     */
    async getPendingReviews(userId: number): Promise<BorrowRequest[]> {
        // Get completed requests where user can still leave a review
        const completedRequests = await this.borrowRequestRepository
            .createQueryBuilder("request")
            .leftJoinAndSelect("request.resource", "resource")
            .leftJoinAndSelect("resource.owner", "owner")
            .leftJoinAndSelect("request.requester", "requester")
            .leftJoin(
                "request.reviews",
                "review",
                "review.reviewer_id = :userId AND review.borrow_request_id = request.id",
                { userId }
            )
            .where("request.status IN (:...statuses)", {
                statuses: ["returned", "completed"],
            })
            .andWhere(
                "(request.requester_id = :userId OR resource.owner_id = :userId)",
                { userId }
            )
            .andWhere("review.id IS NULL") // No review exists yet
            .getMany();

        return completedRequests;
    }

    /**
     * Get review statistics for a user
     */
    async getReviewStatistics(userId: number): Promise<{
        receivedStats: ReviewStats;
        givenCount: number;
        pendingToGive: number;
        responseRate: number;
    }> {
        // Get received reviews stats
        const receivedStats = await this.getUserReviews(userId, 1, 1000);

        // Get count of reviews given
        const givenCount = await this.reviewRepository.count({
            where: { reviewer_id: userId },
        });

        // Get pending reviews to give
        const pendingReviews = await this.getPendingReviews(userId);
        const pendingToGive = pendingReviews.length;

        // Calculate response rate (reviews with responses vs total reviews received)
        const reviewsWithResponses = await this.reviewRepository
            .createQueryBuilder("review")
            .where("review.reviewee_id = :userId", { userId })
            .andWhere("review.response IS NOT NULL")
            .getCount();

        const responseRate =
            receivedStats.totalReviews > 0
                ? (reviewsWithResponses / receivedStats.totalReviews) * 100
                : 0;

        return {
            receivedStats,
            givenCount,
            pendingToGive,
            responseRate: Math.round(responseRate * 10) / 10,
        };
    }

    /**
     * Private method to update user's average rating
     */
    private async updateUserRating(userId: number): Promise<void> {
        const result = await this.reviewRepository
            .createQueryBuilder("review")
            .select("AVG(review.rating)", "average")
            .addSelect("COUNT(review.id)", "count")
            .where("review.reviewee_id = :userId", { userId })
            .andWhere("review.is_hidden = :isHidden", { isHidden: false })
            .getRawOne();

        const averageRating = parseFloat(result.average || "0");
        const totalRatings = parseInt(result.count || "0");

        await this.userRepository.update(userId, {
            average_rating: Math.round(averageRating * 10) / 10,
            total_ratings: totalRatings,
        });
    }

    /**
     * Admin function to moderate a review
     */
    async moderateReview(
        reviewId: number,
        moderatorId: number,
        action: "hide" | "show" | "verify",
        reason?: string
    ): Promise<Review> {
        const review = await this.reviewRepository.findOne({
            where: { id: reviewId },
        });

        if (!review) {
            throw new NotFoundError("Review");
        }

        const updateData: Partial<Review> = {
            moderated_at: new Date(),
            moderated_by: moderatorId,
        };

        switch (action) {
            case "hide":
                updateData.is_hidden = true;
                break;
            case "show":
                updateData.is_hidden = false;
                updateData.is_flagged = false;
                updateData.flag_reason = undefined;
                break;
            case "verify":
                updateData.is_verified = true;
                break;
        }

        await this.reviewRepository.update(reviewId, updateData);

        // Update user rating if review was hidden/shown
        if (action === "hide" || action === "show") {
            await this.updateUserRating(review.reviewee_id);
        }

        return (await this.reviewRepository.findOne({
            where: { id: reviewId },
            relations: [
                "reviewer",
                "reviewee",
                "borrow_request",
                "borrow_request.resource",
            ],
        })) as Review;
    }
}
