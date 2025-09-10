import { Router } from "express";
import { ReviewController } from "../controllers/ReviewController";
import { authenticateToken } from "../middleware/auth";

const router = Router();
const reviewController = new ReviewController();

/**
 * Review Routes
 */

// Get pending reviews (should be before :id routes to avoid conflict)
router.get("/pending", authenticateToken, (req, res) => {
  reviewController.getPendingReviews(req, res);
});

// Get review statistics for the authenticated user
router.get("/statistics", authenticateToken, (req, res) => {
  reviewController.getReviewStatistics(req, res);
});

// Create a new review
router.post("/", authenticateToken, (req, res) => {
  reviewController.createReview(req, res);
});

// Get a specific review by ID
router.get("/:id", (req, res) => {
  reviewController.getReviewById(req, res);
});

// Update a review
router.put("/:id", authenticateToken, (req, res) => {
  reviewController.updateReview(req, res);
});

// Add a response to a review
router.post("/:id/response", authenticateToken, (req, res) => {
  reviewController.addReviewResponse(req, res);
});

// Flag a review for moderation
router.post("/:id/flag", authenticateToken, (req, res) => {
  reviewController.flagReview(req, res);
});

// Vote on review helpfulness
router.post("/:id/vote", authenticateToken, (req, res) => {
  reviewController.voteOnReview(req, res);
});

// Admin endpoint to moderate a review
router.put("/admin/:id/moderate", authenticateToken, (req, res) => {
  reviewController.moderateReview(req, res);
});

export default router;
