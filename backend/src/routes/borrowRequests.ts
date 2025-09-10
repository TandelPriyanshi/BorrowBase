import { Router } from "express";
import { BorrowRequestController } from "../controllers/BorrowRequestController";
import { authenticateToken } from "../middleware/auth";

const router = Router();
const borrowRequestController = new BorrowRequestController();

/**
 * Borrow Request Routes
 */

// Get user statistics (should be before :id routes to avoid conflict)
router.get("/stats", authenticateToken, (req, res) => {
  borrowRequestController.getUserStats(req, res);
});

// Get overdue requests (system/admin endpoint)
router.get("/overdue", authenticateToken, (req, res) => {
  borrowRequestController.getOverdueRequests(req, res);
});

// Create a new borrow request
router.post("/", authenticateToken, (req, res) => {
  borrowRequestController.createBorrowRequest(req, res);
});

// Get a specific borrow request by ID
router.get("/:id", authenticateToken, (req, res) => {
  borrowRequestController.getBorrowRequestById(req, res);
});

// Update borrow request with additional information
router.put("/:id", authenticateToken, (req, res) => {
  borrowRequestController.updateBorrowRequest(req, res);
});

// Update borrow request status (approve/reject)
router.put("/:id/status", authenticateToken, (req, res) => {
  borrowRequestController.updateRequestStatus(req, res);
});

// Cancel a borrow request
router.put("/:id/cancel", authenticateToken, (req, res) => {
  borrowRequestController.cancelRequest(req, res);
});

// Mark request as picked up
router.put("/:id/pickup", authenticateToken, (req, res) => {
  borrowRequestController.markAsPickedUp(req, res);
});

// Mark request as returned
router.put("/:id/return", authenticateToken, (req, res) => {
  borrowRequestController.markAsReturned(req, res);
});

export default router;
