import { Request, Response } from "express";
import { ReviewService } from "../services/ReviewService";
import { AuthenticatedRequest } from "../types/auth";
import { handleControllerError } from "../utils/errors";

export class ReviewController {
    private reviewService: ReviewService;

    constructor() {
        this.reviewService = new ReviewService();
    }

    /**
     * Create a new review
     * POST /api/reviews
     */
    async createReview(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    message: "User not authenticated",
                    success: false,
                });
                return;
            }

            const {
                reviewee_id,
                borrow_request_id,
                rating,
                comment,
                review_type,
                communication_rating,
                reliability_rating,
                item_condition_rating,
                care_rating,
                is_anonymous,
            } = req.body;

            // Validation
            if (!reviewee_id || !rating || !review_type) {
                res.status(400).json({
                    message:
                        "reviewee_id, rating, and review_type are required",
                    success: false,
                });
                return;
            }

            if (typeof rating !== "number" || rating < 1 || rating > 5) {
                res.status(400).json({
                    message: "Rating must be a number between 1 and 5",
                    success: false,
                });
                return;
            }

            if (
                !["borrower_to_owner", "owner_to_borrower"].includes(
                    review_type
                )
            ) {
                res.status(400).json({
                    message:
                        "review_type must be 'borrower_to_owner' or 'owner_to_borrower'",
                    success: false,
                });
                return;
            }

            const review = await this.reviewService.createReview({
                reviewer_id: req.user.id,
                reviewee_id: parseInt(reviewee_id),
                borrow_request_id: borrow_request_id
                    ? parseInt(borrow_request_id)
                    : undefined,
                rating,
                comment,
                review_type,
                communication_rating,
                reliability_rating,
                item_condition_rating,
                care_rating,
                is_anonymous: is_anonymous || false,
            });

            res.status(201).json({
                data: review,
                message: "Review created successfully",
                success: true,
            });
        } catch (error: any) {
            handleControllerError(error, res);
        }
    }

    /**
     * Get reviews for a specific user
     * GET /api/users/:userId/reviews
     */
    async getUserReviews(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(
                parseInt(req.query.limit as string) || 10,
                50
            );
            const reviewType = req.query.review_type as string;

            if (!userId || isNaN(parseInt(userId))) {
                res.status(400).json({
                    message: "Invalid user ID",
                    success: false,
                });
                return;
            }

            const reviewStats = await this.reviewService.getUserReviews(
                parseInt(userId),
                page,
                limit,
                reviewType
            );

            res.json({
                data: reviewStats,
                message: "User reviews retrieved successfully",
                success: true,
            });
        } catch (error: any) {
            handleControllerError(error, res);
        }
    }

    /**
     * Get reviews written by the authenticated user
     * GET /api/my-reviews
     */
    async getMyReviews(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    message: "User not authenticated",
                    success: false,
                });
                return;
            }

            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(
                parseInt(req.query.limit as string) || 10,
                50
            );

            const result = await this.reviewService.getReviewsByUser(
                req.user.id,
                page,
                limit
            );

            res.json({
                data: result.reviews,
                total: result.total,
                message: "Your reviews retrieved successfully",
                success: true,
            });
        } catch (error: any) {
            handleControllerError(error, res);
        }
    }

    /**
     * Get a specific review by ID
     * GET /api/reviews/:id
     */
    async getReviewById(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            const { id } = req.params;
            const reviewId = parseInt(id);

            if (isNaN(reviewId)) {
                res.status(400).json({
                    message: "Invalid review ID",
                    success: false,
                });
                return;
            }

            const userId = req.user?.id;
            const review = await this.reviewService.getReviewById(
                reviewId,
                userId
            );

            res.json({
                data: review,
                message: "Review retrieved successfully",
                success: true,
            });
        } catch (error: any) {
            handleControllerError(error, res);
        }
    }

    /**
     * Update a review
     * PUT /api/reviews/:id
     */
    async updateReview(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    message: "User not authenticated",
                    success: false,
                });
                return;
            }

            const { id } = req.params;
            const reviewId = parseInt(id);

            if (isNaN(reviewId)) {
                res.status(400).json({
                    message: "Invalid review ID",
                    success: false,
                });
                return;
            }

            const {
                rating,
                comment,
                communication_rating,
                reliability_rating,
                item_condition_rating,
                care_rating,
            } = req.body;

            // Validate rating if provided
            if (
                rating !== undefined &&
                (typeof rating !== "number" || rating < 1 || rating > 5)
            ) {
                res.status(400).json({
                    message: "Rating must be a number between 1 and 5",
                    success: false,
                });
                return;
            }

            const review = await this.reviewService.updateReview(
                reviewId,
                req.user.id,
                {
                    rating,
                    comment,
                    communication_rating,
                    reliability_rating,
                    item_condition_rating,
                    care_rating,
                }
            );

            res.json({
                data: review,
                message: "Review updated successfully",
                success: true,
            });
        } catch (error: any) {
            handleControllerError(error, res);
        }
    }

    /**
     * Add a response to a review
     * POST /api/reviews/:id/response
     */
    async addReviewResponse(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    message: "User not authenticated",
                    success: false,
                });
                return;
            }

            const { id } = req.params;
            const { response } = req.body;
            const reviewId = parseInt(id);

            if (isNaN(reviewId)) {
                res.status(400).json({
                    message: "Invalid review ID",
                    success: false,
                });
                return;
            }

            if (
                !response ||
                typeof response !== "string" ||
                response.trim().length === 0
            ) {
                res.status(400).json({
                    message: "Response is required and cannot be empty",
                    success: false,
                });
                return;
            }

            if (response.length > 1000) {
                res.status(400).json({
                    message: "Response cannot exceed 1000 characters",
                    success: false,
                });
                return;
            }

            const review = await this.reviewService.addReviewResponse(
                reviewId,
                req.user.id,
                response.trim()
            );

            res.json({
                data: review,
                message: "Response added successfully",
                success: true,
            });
        } catch (error: any) {
            handleControllerError(error, res);
        }
    }

    /**
     * Flag a review for moderation
     * POST /api/reviews/:id/flag
     */
    async flagReview(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    message: "User not authenticated",
                    success: false,
                });
                return;
            }

            const { id } = req.params;
            const { reason } = req.body;
            const reviewId = parseInt(id);

            if (isNaN(reviewId)) {
                res.status(400).json({
                    message: "Invalid review ID",
                    success: false,
                });
                return;
            }

            if (
                !reason ||
                typeof reason !== "string" ||
                reason.trim().length === 0
            ) {
                res.status(400).json({
                    message: "Flag reason is required",
                    success: false,
                });
                return;
            }

            await this.reviewService.flagReview(
                reviewId,
                req.user.id,
                reason.trim()
            );

            res.json({
                message: "Review flagged successfully",
                success: true,
            });
        } catch (error: any) {
            handleControllerError(error, res);
        }
    }

    /**
     * Vote on review helpfulness
     * POST /api/reviews/:id/vote
     */
    async voteOnReview(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    message: "User not authenticated",
                    success: false,
                });
                return;
            }

            const { id } = req.params;
            const { is_helpful } = req.body;
            const reviewId = parseInt(id);

            if (isNaN(reviewId)) {
                res.status(400).json({
                    message: "Invalid review ID",
                    success: false,
                });
                return;
            }

            if (typeof is_helpful !== "boolean") {
                res.status(400).json({
                    message: "is_helpful must be a boolean value",
                    success: false,
                });
                return;
            }

            const review = await this.reviewService.voteOnReview(
                reviewId,
                req.user.id,
                is_helpful
            );

            res.json({
                data: review,
                message: "Vote recorded successfully",
                success: true,
            });
        } catch (error: any) {
            handleControllerError(error, res);
        }
    }

    /**
     * Get pending reviews for the authenticated user
     * GET /api/reviews/pending
     */
    async getPendingReviews(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    message: "User not authenticated",
                    success: false,
                });
                return;
            }

            const pendingReviews = await this.reviewService.getPendingReviews(
                req.user.id
            );

            res.json({
                data: pendingReviews,
                message: "Pending reviews retrieved successfully",
                success: true,
            });
        } catch (error: any) {
            handleControllerError(error, res);
        }
    }

    /**
     * Get review statistics for the authenticated user
     * GET /api/reviews/statistics
     */
    async getReviewStatistics(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    message: "User not authenticated",
                    success: false,
                });
                return;
            }

            const statistics = await this.reviewService.getReviewStatistics(
                req.user.id
            );

            res.json({
                data: statistics,
                message: "Review statistics retrieved successfully",
                success: true,
            });
        } catch (error: any) {
            handleControllerError(error, res);
        }
    }

    /**
     * Get review statistics for a specific user (public endpoint)
     * GET /api/users/:userId/review-stats
     */
    async getUserReviewStatistics(req: Request, res: Response): Promise<void> {
        try {
            const { userId } = req.params;

            if (!userId || isNaN(parseInt(userId))) {
                res.status(400).json({
                    message: "Invalid user ID",
                    success: false,
                });
                return;
            }

            const statistics = await this.reviewService.getReviewStatistics(
                parseInt(userId)
            );

            // Only return public statistics (don't include sensitive internal data)
            const publicStats = {
                receivedStats: statistics.receivedStats,
                responseRate: statistics.responseRate,
            };

            res.json({
                data: publicStats,
                message: "User review statistics retrieved successfully",
                success: true,
            });
        } catch (error: any) {
            handleControllerError(error, res);
        }
    }

    /**
     * Admin endpoint to moderate a review
     * PUT /api/admin/reviews/:id/moderate
     */
    async moderateReview(
        req: AuthenticatedRequest,
        res: Response
    ): Promise<void> {
        try {
            if (!req.user) {
                res.status(401).json({
                    message: "User not authenticated",
                    success: false,
                });
                return;
            }

            // In a real implementation, you'd check if the user is an admin
            // For now, we'll just implement the functionality

            const { id } = req.params;
            const { action, reason } = req.body;
            const reviewId = parseInt(id);

            if (isNaN(reviewId)) {
                res.status(400).json({
                    message: "Invalid review ID",
                    success: false,
                });
                return;
            }

            if (!action || !["hide", "show", "verify"].includes(action)) {
                res.status(400).json({
                    message: "Action must be 'hide', 'show', or 'verify'",
                    success: false,
                });
                return;
            }

            const review = await this.reviewService.moderateReview(
                reviewId,
                req.user.id,
                action,
                reason
            );

            res.json({
                data: review,
                message: `Review ${action} action completed successfully`,
                success: true,
            });
        } catch (error: any) {
            handleControllerError(error, res);
        }
    }
}
