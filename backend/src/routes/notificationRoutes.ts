import { Router } from "express";
import { body, param } from "express-validator";
import { NotificationController } from "../controllers/NotificationController";
import { authenticateToken } from "../middleware/auth";

const router = Router();
const notificationController = new NotificationController();

// Apply authentication to all notification routes
router.use(authenticateToken);

/**
 * @route GET /api/notifications
 * @desc Get notifications for authenticated user
 * @access Private
 */
router.get("/", notificationController.getUserNotifications);

/**
 * @route GET /api/notifications/unread-count
 * @desc Get unread notification count
 * @access Private
 */
router.get("/unread-count", notificationController.getUnreadCount);

/**
 * @route GET /api/notifications/stats
 * @desc Get notification statistics
 * @access Private
 */
router.get("/stats", notificationController.getNotificationStats);

/**
 * @route GET /api/notifications/scheduled
 * @desc Get scheduled notifications ready for sending (admin only)
 * @access Private (Admin)
 */
router.get("/scheduled", notificationController.getScheduledNotifications);

/**
 * @route PUT /api/notifications/:id/read
 * @desc Mark a notification as read
 * @access Private
 */
router.put(
  "/:id/read",
  [
    param("id")
      .isNumeric()
      .withMessage("Notification ID must be a number")
  ],
  notificationController.markAsRead
);

/**
 * @route PUT /api/notifications/mark-multiple-read
 * @desc Mark multiple notifications as read
 * @access Private
 */
router.put(
  "/mark-multiple-read",
  [
    body("notification_ids")
      .isArray({ min: 1 })
      .withMessage("notification_ids must be a non-empty array"),
    body("notification_ids.*")
      .isNumeric()
      .withMessage("Each notification ID must be a number")
  ],
  notificationController.markMultipleAsRead
);

/**
 * @route PUT /api/notifications/mark-all-read
 * @desc Mark all notifications as read
 * @access Private
 */
router.put(
  "/mark-all-read",
  [
    body("notification_type")
      .optional()
      .isString()
      .isIn([
        "borrow_request_created",
        "borrow_request_approved",
        "borrow_request_rejected",
        "borrow_request_cancelled",
        "borrow_request_pickup_ready",
        "borrow_request_overdue",
        "borrow_request_returned",
        "review_received",
        "review_response",
        "chat_message",
        "resource_available",
        "system_announcement",
        "account_update",
        "reminder"
      ])
      .withMessage("Invalid notification type")
  ],
  notificationController.markAllAsRead
);

/**
 * @route DELETE /api/notifications/:id
 * @desc Delete a notification
 * @access Private
 */
router.delete(
  "/:id",
  [
    param("id")
      .isNumeric()
      .withMessage("Notification ID must be a number")
  ],
  notificationController.deleteNotification
);

/**
 * @route DELETE /api/notifications/delete-multiple
 * @desc Delete multiple notifications
 * @access Private
 */
router.delete(
  "/delete-multiple",
  [
    body("notification_ids")
      .isArray({ min: 1 })
      .withMessage("notification_ids must be a non-empty array"),
    body("notification_ids.*")
      .isNumeric()
      .withMessage("Each notification ID must be a number")
  ],
  notificationController.deleteMultipleNotifications
);

/**
 * @route POST /api/notifications
 * @desc Create a notification (admin only)
 * @access Private (Admin)
 */
router.post(
  "/",
  [
    body("user_id")
      .isNumeric()
      .withMessage("user_id must be a number"),
    body("title")
      .isString()
      .isLength({ min: 1, max: 255 })
      .withMessage("Title must be between 1 and 255 characters"),
    body("message")
      .isString()
      .isLength({ min: 1, max: 1000 })
      .withMessage("Message must be between 1 and 1000 characters"),
    body("notification_type")
      .isString()
      .isIn([
        "borrow_request_created",
        "borrow_request_approved",
        "borrow_request_rejected",
        "borrow_request_cancelled",
        "borrow_request_pickup_ready",
        "borrow_request_overdue",
        "borrow_request_returned",
        "review_received",
        "review_response",
        "chat_message",
        "resource_available",
        "system_announcement",
        "account_update",
        "reminder"
      ])
      .withMessage("Invalid notification type"),
    body("priority")
      .optional()
      .isString()
      .isIn(["low", "normal", "high", "urgent"])
      .withMessage("Priority must be one of: low, normal, high, urgent"),
    body("related_resource_id")
      .optional()
      .isNumeric()
      .withMessage("related_resource_id must be a number"),
    body("related_borrow_request_id")
      .optional()
      .isNumeric()
      .withMessage("related_borrow_request_id must be a number"),
    body("related_chat_id")
      .optional()
      .isNumeric()
      .withMessage("related_chat_id must be a number"),
    body("related_review_id")
      .optional()
      .isNumeric()
      .withMessage("related_review_id must be a number"),
    body("related_user_id")
      .optional()
      .isNumeric()
      .withMessage("related_user_id must be a number"),
    body("action_url")
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage("action_url cannot exceed 500 characters"),
    body("action_text")
      .optional()
      .isString()
      .isLength({ max: 100 })
      .withMessage("action_text cannot exceed 100 characters"),
    body("metadata")
      .optional()
      .isObject()
      .withMessage("metadata must be an object"),
    body("scheduled_for")
      .optional()
      .isISO8601()
      .withMessage("scheduled_for must be a valid ISO8601 date"),
    body("expires_at")
      .optional()
      .isISO8601()
      .withMessage("expires_at must be a valid ISO8601 date")
  ],
  notificationController.createNotification
);

/**
 * @route POST /api/notifications/bulk
 * @desc Create bulk notifications (admin only)
 * @access Private (Admin)
 */
router.post(
  "/bulk",
  [
    body("user_ids")
      .isArray({ min: 1 })
      .withMessage("user_ids must be a non-empty array"),
    body("user_ids.*")
      .isNumeric()
      .withMessage("Each user ID must be a number"),
    body("title")
      .isString()
      .isLength({ min: 1, max: 255 })
      .withMessage("Title must be between 1 and 255 characters"),
    body("message")
      .isString()
      .isLength({ min: 1, max: 1000 })
      .withMessage("Message must be between 1 and 1000 characters"),
    body("notification_type")
      .isString()
      .isIn([
        "borrow_request_created",
        "borrow_request_approved",
        "borrow_request_rejected",
        "borrow_request_cancelled",
        "borrow_request_pickup_ready",
        "borrow_request_overdue",
        "borrow_request_returned",
        "review_received",
        "review_response",
        "chat_message",
        "resource_available",
        "system_announcement",
        "account_update",
        "reminder"
      ])
      .withMessage("Invalid notification type"),
    body("priority")
      .optional()
      .isString()
      .isIn(["low", "normal", "high", "urgent"])
      .withMessage("Priority must be one of: low, normal, high, urgent"),
    body("related_resource_id")
      .optional()
      .isNumeric()
      .withMessage("related_resource_id must be a number"),
    body("related_borrow_request_id")
      .optional()
      .isNumeric()
      .withMessage("related_borrow_request_id must be a number"),
    body("related_chat_id")
      .optional()
      .isNumeric()
      .withMessage("related_chat_id must be a number"),
    body("related_review_id")
      .optional()
      .isNumeric()
      .withMessage("related_review_id must be a number"),
    body("related_user_id")
      .optional()
      .isNumeric()
      .withMessage("related_user_id must be a number"),
    body("action_url")
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage("action_url cannot exceed 500 characters"),
    body("action_text")
      .optional()
      .isString()
      .isLength({ max: 100 })
      .withMessage("action_text cannot exceed 100 characters"),
    body("metadata")
      .optional()
      .isObject()
      .withMessage("metadata must be an object"),
    body("scheduled_for")
      .optional()
      .isISO8601()
      .withMessage("scheduled_for must be a valid ISO8601 date"),
    body("expires_at")
      .optional()
      .isISO8601()
      .withMessage("expires_at must be a valid ISO8601 date")
  ],
  notificationController.createBulkNotifications
);

/**
 * @route PUT /api/notifications/:id/sent
 * @desc Mark notification as sent (admin only)
 * @access Private (Admin)
 */
router.put(
  "/:id/sent",
  [
    param("id")
      .isNumeric()
      .withMessage("Notification ID must be a number"),
    body("delivery_methods")
      .optional()
      .isObject()
      .withMessage("delivery_methods must be an object"),
    body("delivery_methods.push")
      .optional()
      .isBoolean()
      .withMessage("delivery_methods.push must be a boolean"),
    body("delivery_methods.email")
      .optional()
      .isBoolean()
      .withMessage("delivery_methods.email must be a boolean"),
    body("delivery_methods.sms")
      .optional()
      .isBoolean()
      .withMessage("delivery_methods.sms must be a boolean")
  ],
  notificationController.markAsSent
);

/**
 * @route DELETE /api/notifications/cleanup-expired
 * @desc Clean up expired notifications (admin only)
 * @access Private (Admin)
 */
router.delete("/cleanup-expired", notificationController.cleanupExpiredNotifications);

export default router;
