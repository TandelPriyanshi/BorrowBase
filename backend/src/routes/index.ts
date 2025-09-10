import { Router } from "express";
import authRoutes from "./auth";
import resourceRoutes from "./resources";
import uploadRoutes from "./uploads";
import chatRoutes from "./chats";
import borrowRequestRoutes from "./borrowRequests";
import reviewRoutes from "./reviews";
import notificationRoutes from "./notificationRoutes";
import { BorrowRequestController } from "../controllers/BorrowRequestController";
import { ReviewController } from "../controllers/ReviewController";
import { authenticateToken } from "../middleware/auth";

const router = Router();
const borrowRequestController = new BorrowRequestController();
const reviewController = new ReviewController();

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "BorrowBase API is running",
    timestamp: new Date().toISOString(),
    success: true,
  });
});

// Authentication routes
router.use("/auth", authRoutes);

// Resource routes
router.use("/resources", resourceRoutes);

// File upload routes
router.use("/uploads", uploadRoutes);

// Chat routes
router.use("/chats", chatRoutes);

// Borrow request routes
router.use("/borrow-requests", borrowRequestRoutes);

// Review routes
router.use("/reviews", reviewRoutes);

// Notification routes
router.use("/notifications", notificationRoutes);

// Legacy routes to match old API structure
// User's borrow requests
router.get("/my-requests", authenticateToken, (req, res) => {
  borrowRequestController.getMyRequests(req, res);
});

// Requests for user's resources
router.get("/resource-requests", authenticateToken, (req, res) => {
  borrowRequestController.getResourceRequests(req, res);
});

// Legacy borrow route
router.post("/borrow", authenticateToken, (req, res) => {
  borrowRequestController.createBorrowRequest(req, res);
});

// User reviews (public endpoint)
router.get("/users/:userId/reviews", (req, res) => {
  reviewController.getUserReviews(req, res);
});

// Legacy review route
router.get("/reviews/:userId", (req, res) => {
  reviewController.getUserReviews(req, res);
});

// User's own reviews
router.get("/my-reviews", authenticateToken, (req, res) => {
  reviewController.getMyReviews(req, res);
});

// User review statistics
router.get("/users/:userId/review-stats", (req, res) => {
  reviewController.getUserReviewStatistics(req, res);
});

// Profile routes (mounted at root level to match old API)
router.use("/", authRoutes); // This allows /api/profile, /api/update-location

export default router;
