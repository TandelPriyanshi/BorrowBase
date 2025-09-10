import { Request, Response } from "express";
import { 
  NotificationService, 
  NotificationCreateData, 
  NotificationType, 
  NotificationPriority 
} from "../services/NotificationService";
import { 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError 
} from "../utils/errors";
import { validationResult } from "express-validator";

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Get notifications for the authenticated user
   * GET /api/notifications
   */
  getUserNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const {
        unread_only,
        notification_type,
        priority,
        page,
        limit,
        include_expired
      } = req.query;

      const options = {
        unread_only: unread_only === 'true',
        notification_type: notification_type as string,
        priority: priority as NotificationPriority,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 50,
        include_expired: include_expired === 'true'
      };

      const result = await this.notificationService.getUserNotifications(userId, options);

      res.status(200).json({
        success: true,
        data: {
          notifications: result.notifications,
          pagination: {
            page: options.page,
            limit: options.limit,
            total: result.total,
            totalPages: Math.ceil(result.total / options.limit)
          },
          unread_count: result.unread_count
        }
      });
    } catch (error) {
      console.error('Error getting user notifications:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve notifications'
      });
    }
  };

  /**
   * Get unread notification count
   * GET /api/notifications/unread-count
   */
  getUnreadCount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const count = await this.notificationService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: { unread_count: count }
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get unread count'
      });
    }
  };

  /**
   * Get notification statistics
   * GET /api/notifications/stats
   */
  getNotificationStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const stats = await this.notificationService.getNotificationStats(userId);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting notification stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get notification statistics'
      });
    }
  };

  /**
   * Mark a notification as read
   * PUT /api/notifications/:id/read
   */
  markAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const notificationId = parseInt(req.params.id, 10);
      const userId = req.user!.id;

      if (isNaN(notificationId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid notification ID'
        });
        return;
      }

      const notification = await this.notificationService.markAsRead(notificationId, userId);

      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data: notification
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof UnauthorizedError) {
        res.status(403).json({
          success: false,
          error: error.message
        });
      } else {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to mark notification as read'
        });
      }
    }
  };

  /**
   * Mark multiple notifications as read
   * PUT /api/notifications/mark-multiple-read
   */
  markMultipleAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const { notification_ids } = req.body;
      const userId = req.user!.id;

      if (!Array.isArray(notification_ids) || notification_ids.length === 0) {
        res.status(400).json({
          success: false,
          error: 'notification_ids must be a non-empty array'
        });
        return;
      }

      const updatedCount = await this.notificationService.markMultipleAsRead(
        notification_ids,
        userId
      );

      res.status(200).json({
        success: true,
        message: `${updatedCount} notifications marked as read`,
        data: { updated_count: updatedCount }
      });
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        res.status(403).json({
          success: false,
          error: error.message
        });
      } else {
        console.error('Error marking multiple notifications as read:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to mark notifications as read'
        });
      }
    }
  };

  /**
   * Mark all notifications as read
   * PUT /api/notifications/mark-all-read
   */
  markAllAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { notification_type } = req.body;

      const updatedCount = await this.notificationService.markAllAsRead(
        userId,
        notification_type as NotificationType
      );

      res.status(200).json({
        success: true,
        message: `${updatedCount} notifications marked as read`,
        data: { updated_count: updatedCount }
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark all notifications as read'
      });
    }
  };

  /**
   * Delete a notification
   * DELETE /api/notifications/:id
   */
  deleteNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const notificationId = parseInt(req.params.id, 10);
      const userId = req.user!.id;

      if (isNaN(notificationId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid notification ID'
        });
        return;
      }

      await this.notificationService.deleteNotification(notificationId, userId);

      res.status(200).json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof UnauthorizedError) {
        res.status(403).json({
          success: false,
          error: error.message
        });
      } else {
        console.error('Error deleting notification:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to delete notification'
        });
      }
    }
  };

  /**
   * Delete multiple notifications
   * DELETE /api/notifications/delete-multiple
   */
  deleteMultipleNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const { notification_ids } = req.body;
      const userId = req.user!.id;

      if (!Array.isArray(notification_ids) || notification_ids.length === 0) {
        res.status(400).json({
          success: false,
          error: 'notification_ids must be a non-empty array'
        });
        return;
      }

      const deletedCount = await this.notificationService.deleteMultipleNotifications(
        notification_ids,
        userId
      );

      res.status(200).json({
        success: true,
        message: `${deletedCount} notifications deleted successfully`,
        data: { deleted_count: deletedCount }
      });
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        res.status(403).json({
          success: false,
          error: error.message
        });
      } else {
        console.error('Error deleting multiple notifications:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to delete notifications'
        });
      }
    }
  };

  /**
   * Create a notification (admin only)
   * POST /api/notifications
   */
  createNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      // Check if user is admin (you may need to adjust this based on your role system)
      if (req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Only administrators can create notifications'
        });
        return;
      }

      const notificationData: NotificationCreateData = {
        user_id: req.body.user_id,
        title: req.body.title,
        message: req.body.message,
        notification_type: req.body.notification_type,
        priority: req.body.priority || 'normal',
        related_resource_id: req.body.related_resource_id,
        related_borrow_request_id: req.body.related_borrow_request_id,
        related_chat_id: req.body.related_chat_id,
        related_review_id: req.body.related_review_id,
        related_user_id: req.body.related_user_id,
        action_url: req.body.action_url,
        action_text: req.body.action_text,
        metadata: req.body.metadata,
        scheduled_for: req.body.scheduled_for ? new Date(req.body.scheduled_for) : undefined,
        expires_at: req.body.expires_at ? new Date(req.body.expires_at) : undefined
      };

      const notification = await this.notificationService.createNotification(notificationData);

      res.status(201).json({
        success: true,
        message: 'Notification created successfully',
        data: notification
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        console.error('Error creating notification:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to create notification'
        });
      }
    }
  };

  /**
   * Create bulk notifications (admin only)
   * POST /api/notifications/bulk
   */
  createBulkNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      // Check if user is admin
      if (req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Only administrators can create bulk notifications'
        });
        return;
      }

      const { user_ids, ...notificationData } = req.body;

      if (!Array.isArray(user_ids) || user_ids.length === 0) {
        res.status(400).json({
          success: false,
          error: 'user_ids must be a non-empty array'
        });
        return;
      }

      const notifications = await this.notificationService.createBulkNotifications(
        user_ids,
        {
          title: notificationData.title,
          message: notificationData.message,
          notification_type: notificationData.notification_type,
          priority: notificationData.priority || 'normal',
          related_resource_id: notificationData.related_resource_id,
          related_borrow_request_id: notificationData.related_borrow_request_id,
          related_chat_id: notificationData.related_chat_id,
          related_review_id: notificationData.related_review_id,
          related_user_id: notificationData.related_user_id,
          action_url: notificationData.action_url,
          action_text: notificationData.action_text,
          metadata: notificationData.metadata,
          scheduled_for: notificationData.scheduled_for ? new Date(notificationData.scheduled_for) : undefined,
          expires_at: notificationData.expires_at ? new Date(notificationData.expires_at) : undefined
        }
      );

      res.status(201).json({
        success: true,
        message: `${notifications.length} notifications created successfully`,
        data: {
          created_count: notifications.length,
          notifications: notifications
        }
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        console.error('Error creating bulk notifications:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to create bulk notifications'
        });
      }
    }
  };

  /**
   * Clean up expired notifications (admin only)
   * DELETE /api/notifications/cleanup-expired
   */
  cleanupExpiredNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Check if user is admin
      if (req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Only administrators can cleanup expired notifications'
        });
        return;
      }

      const deletedCount = await this.notificationService.cleanupExpiredNotifications();

      res.status(200).json({
        success: true,
        message: `${deletedCount} expired notifications cleaned up`,
        data: { deleted_count: deletedCount }
      });
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cleanup expired notifications'
      });
    }
  };

  /**
   * Get scheduled notifications ready for sending (admin only)
   * GET /api/notifications/scheduled
   */
  getScheduledNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Check if user is admin
      if (req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Only administrators can view scheduled notifications'
        });
        return;
      }

      const notifications = await this.notificationService.getScheduledNotificationsForSending();

      res.status(200).json({
        success: true,
        data: {
          notifications,
          count: notifications.length
        }
      });
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get scheduled notifications'
      });
    }
  };

  /**
   * Mark notification as sent (admin only)
   * PUT /api/notifications/:id/sent
   */
  markAsSent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const notificationId = parseInt(req.params.id, 10);
      const { delivery_methods } = req.body;

      if (isNaN(notificationId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid notification ID'
        });
        return;
      }

      // Check if user is admin
      if (req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Only administrators can mark notifications as sent'
        });
        return;
      }

      await this.notificationService.markAsSent(notificationId, delivery_methods || {});

      res.status(200).json({
        success: true,
        message: 'Notification marked as sent'
      });
    } catch (error) {
      console.error('Error marking notification as sent:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark notification as sent'
      });
    }
  };
}
