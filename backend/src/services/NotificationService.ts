import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { Notification } from "../entities/Notification";
import { User } from "../entities/User";
import { 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError 
} from "../utils/errors";

export interface NotificationCreateData {
  user_id: number;
  title: string;
  message: string;
  notification_type: NotificationType;
  priority?: NotificationPriority;
  related_resource_id?: number;
  related_borrow_request_id?: number;
  related_chat_id?: number;
  related_review_id?: number;
  related_user_id?: number;
  action_url?: string;
  action_text?: string;
  metadata?: Record<string, any>;
  scheduled_for?: Date;
  expires_at?: Date;
}

export type NotificationType = 
  | "borrow_request_created"
  | "borrow_request_approved" 
  | "borrow_request_rejected"
  | "borrow_request_cancelled"
  | "borrow_request_pickup_ready"
  | "borrow_request_overdue"
  | "borrow_request_returned"
  | "review_received"
  | "review_response"
  | "chat_message"
  | "resource_available"
  | "system_announcement"
  | "account_update"
  | "reminder";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

export class NotificationService {
  private notificationRepository: Repository<Notification>;
  private userRepository: Repository<User>;

  constructor() {
    this.notificationRepository = AppDataSource.getRepository(Notification);
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * Create a new notification
   */
  async createNotification(data: NotificationCreateData): Promise<Notification> {
    // Validate user exists
    const user = await this.userRepository.findOne({ where: { id: data.user_id } });
    if (!user) {
      throw new NotFoundError("User");
    }

    // Validate required fields
    if (!data.title || !data.message || !data.notification_type) {
      throw new ValidationError("Title, message, and notification_type are required");
    }

    if (data.title.length > 255) {
      throw new ValidationError("Title cannot exceed 255 characters");
    }

    // Set defaults
    const notification = this.notificationRepository.create({
      ...data,
      priority: data.priority || "normal",
      is_read: false,
      is_sent: false
    });

    const savedNotification = await this.notificationRepository.save(notification);

    // Return with relations
    return await this.notificationRepository.findOne({
      where: { id: savedNotification.id },
      relations: ["user", "related_user"]
    }) as Notification;
  }

  /**
   * Get notifications for a user with filtering and pagination
   */
  async getUserNotifications(
    userId: number,
    options: {
      unread_only?: boolean;
      notification_type?: string;
      priority?: NotificationPriority;
      page?: number;
      limit?: number;
      include_expired?: boolean;
    } = {}
  ): Promise<{
    notifications: Notification[];
    total: number;
    unread_count: number;
  }> {
    const {
      unread_only = false,
      notification_type,
      priority,
      page = 1,
      limit = 50,
      include_expired = false
    } = options;

    const queryBuilder = this.notificationRepository
      .createQueryBuilder("notification")
      .leftJoinAndSelect("notification.related_user", "relatedUser")
      .where("notification.user_id = :userId", { userId })
      .orderBy("notification.created_at", "DESC");

    if (unread_only) {
      queryBuilder.andWhere("notification.is_read = :isRead", { isRead: false });
    }

    if (notification_type) {
      queryBuilder.andWhere("notification.notification_type = :type", { type: notification_type });
    }

    if (priority) {
      queryBuilder.andWhere("notification.priority = :priority", { priority });
    }

    if (!include_expired) {
      queryBuilder.andWhere(
        "(notification.expires_at IS NULL OR notification.expires_at > :now)",
        { now: new Date() }
      );
    }

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    const notifications = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // Get unread count
    const unread_count = await this.notificationRepository.count({
      where: { 
        user_id: userId, 
        is_read: false 
      }
    });

    return {
      notifications,
      total,
      unread_count
    };
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: number, userId: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId }
    });

    if (!notification) {
      throw new NotFoundError("Notification");
    }

    if (notification.user_id !== userId) {
      throw new UnauthorizedError("Not authorized to update this notification");
    }

    if (notification.is_read) {
      // Already read, just return the notification
      return await this.notificationRepository.findOne({
        where: { id: notificationId },
        relations: ["user", "related_user"]
      }) as Notification;
    }

    await this.notificationRepository.update(notificationId, {
      is_read: true,
      read_at: new Date()
    });

    return await this.notificationRepository.findOne({
      where: { id: notificationId },
      relations: ["user", "related_user"]
    }) as Notification;
  }

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(notificationIds: number[], userId: number): Promise<number> {
    if (notificationIds.length === 0) {
      return 0;
    }

    // Verify all notifications belong to the user
    const notifications = await this.notificationRepository
      .createQueryBuilder("notification")
      .where("notification.id IN (:...ids)", { ids: notificationIds })
      .andWhere("notification.user_id = :userId", { userId })
      .getMany();

    if (notifications.length !== notificationIds.length) {
      throw new UnauthorizedError("Some notifications do not belong to this user");
    }

    const updateResult = await this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({
        is_read: true,
        read_at: new Date()
      })
      .where("id IN (:...ids)", { ids: notificationIds })
      .andWhere("user_id = :userId", { userId })
      .andWhere("is_read = :isRead", { isRead: false })
      .execute();

    return updateResult.affected || 0;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: number, notificationType?: NotificationType): Promise<number> {
    const queryBuilder = this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({
        is_read: true,
        read_at: new Date()
      })
      .where("user_id = :userId", { userId })
      .andWhere("is_read = :isRead", { isRead: false });

    if (notificationType) {
      queryBuilder.andWhere("notification_type = :type", { type: notificationType });
    }

    const updateResult = await queryBuilder.execute();
    return updateResult.affected || 0;
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: number, userId: number): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId }
    });

    if (!notification) {
      throw new NotFoundError("Notification");
    }

    if (notification.user_id !== userId) {
      throw new UnauthorizedError("Not authorized to delete this notification");
    }

    await this.notificationRepository.delete(notificationId);
  }

  /**
   * Delete multiple notifications
   */
  async deleteMultipleNotifications(notificationIds: number[], userId: number): Promise<number> {
    if (notificationIds.length === 0) {
      return 0;
    }

    // Verify all notifications belong to the user
    const notifications = await this.notificationRepository
      .createQueryBuilder("notification")
      .where("notification.id IN (:...ids)", { ids: notificationIds })
      .andWhere("notification.user_id = :userId", { userId })
      .getMany();

    if (notifications.length !== notificationIds.length) {
      throw new UnauthorizedError("Some notifications do not belong to this user");
    }

    const deleteResult = await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .from(Notification)
      .where("id IN (:...ids)", { ids: notificationIds })
      .andWhere("user_id = :userId", { userId })
      .execute();

    return deleteResult.affected || 0;
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: number): Promise<number> {
    return await this.notificationRepository.count({
      where: {
        user_id: userId,
        is_read: false
      }
    });
  }

  /**
   * Get notification statistics for a user
   */
  async getNotificationStats(userId: number): Promise<NotificationStats> {
    const notifications = await this.notificationRepository.find({
      where: { user_id: userId }
    });

    const stats: NotificationStats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.is_read).length,
      byType: {},
      byPriority: {}
    };

    notifications.forEach(notification => {
      // Count by type
      stats.byType[notification.notification_type] = 
        (stats.byType[notification.notification_type] || 0) + 1;

      // Count by priority
      stats.byPriority[notification.priority] = 
        (stats.byPriority[notification.priority] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications(): Promise<number> {
    const deleteResult = await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .from(Notification)
      .where("expires_at IS NOT NULL")
      .andWhere("expires_at < :now", { now: new Date() })
      .execute();

    return deleteResult.affected || 0;
  }

  /**
   * Get scheduled notifications ready to be sent
   */
  async getScheduledNotificationsForSending(): Promise<Notification[]> {
    return await this.notificationRepository
      .createQueryBuilder("notification")
      .leftJoinAndSelect("notification.user", "user")
      .leftJoinAndSelect("notification.related_user", "relatedUser")
      .where("notification.scheduled_for IS NOT NULL")
      .andWhere("notification.scheduled_for <= :now", { now: new Date() })
      .andWhere("notification.is_sent = :isSent", { isSent: false })
      .orderBy("notification.scheduled_for", "ASC")
      .getMany();
  }

  /**
   * Mark notification as sent (for delivery tracking)
   */
  async markAsSent(
    notificationId: number, 
    deliveryMethods: {
      push?: boolean;
      email?: boolean;
      sms?: boolean;
    }
  ): Promise<void> {
    const updateData: Partial<Notification> = {
      is_sent: true
    };

    const now = new Date();

    if (deliveryMethods.push) {
      updateData.is_push_sent = true;
      updateData.push_sent_at = now;
    }

    if (deliveryMethods.email) {
      updateData.is_email_sent = true;
      updateData.email_sent_at = now;
    }

    if (deliveryMethods.sms) {
      updateData.is_sms_sent = true;
      updateData.sms_sent_at = now;
    }

    await this.notificationRepository.update(notificationId, updateData);
  }

  /**
   * Create bulk notifications for multiple users
   */
  async createBulkNotifications(
    userIds: number[], 
    notificationData: Omit<NotificationCreateData, 'user_id'>
  ): Promise<Notification[]> {
    if (userIds.length === 0) {
      return [];
    }

    // Validate users exist
    const users = await this.userRepository
      .createQueryBuilder("user")
      .where("user.id IN (:...userIds)", { userIds })
      .getMany();

    if (users.length !== userIds.length) {
      throw new ValidationError("Some users do not exist");
    }

    const notifications = userIds.map(userId => 
      this.notificationRepository.create({
        ...notificationData,
        user_id: userId,
        priority: notificationData.priority || "normal",
        is_read: false,
        is_sent: false
      })
    );

    return await this.notificationRepository.save(notifications);
  }

  /**
   * Helper methods for creating specific notification types
   */

  async createBorrowRequestNotification(
    userId: number,
    type: "created" | "approved" | "rejected" | "cancelled" | "overdue",
    borrowRequestId: number,
    relatedUserId?: number,
    additionalData?: Record<string, any>
  ): Promise<Notification> {
    const templates = {
      created: {
        title: "New Borrow Request",
        message: "Someone has requested to borrow your item",
        priority: "normal" as NotificationPriority
      },
      approved: {
        title: "Request Approved",
        message: "Your borrow request has been approved",
        priority: "high" as NotificationPriority
      },
      rejected: {
        title: "Request Rejected",
        message: "Your borrow request has been rejected",
        priority: "normal" as NotificationPriority
      },
      cancelled: {
        title: "Request Cancelled",
        message: "A borrow request has been cancelled",
        priority: "normal" as NotificationPriority
      },
      overdue: {
        title: "Item Overdue",
        message: "You have an overdue item that needs to be returned",
        priority: "urgent" as NotificationPriority
      }
    };

    const template = templates[type];

    return await this.createNotification({
      user_id: userId,
      title: template.title,
      message: template.message,
      notification_type: `borrow_request_${type}` as NotificationType,
      priority: template.priority,
      related_borrow_request_id: borrowRequestId,
      related_user_id: relatedUserId,
      action_url: `/borrow-requests/${borrowRequestId}`,
      action_text: "View Request",
      metadata: additionalData
    });
  }

  async createReviewNotification(
    userId: number,
    type: "received" | "response",
    reviewId: number,
    relatedUserId?: number,
    rating?: number
  ): Promise<Notification> {
    const templates = {
      received: {
        title: "New Review",
        message: rating ? `You received a ${rating}-star review` : "You received a new review",
        priority: "normal" as NotificationPriority
      },
      response: {
        title: "Review Response",
        message: "Someone responded to your review",
        priority: "normal" as NotificationPriority
      }
    };

    const template = templates[type];

    return await this.createNotification({
      user_id: userId,
      title: template.title,
      message: template.message,
      notification_type: `review_${type}` as NotificationType,
      priority: template.priority,
      related_review_id: reviewId,
      related_user_id: relatedUserId,
      action_url: `/reviews/${reviewId}`,
      action_text: "View Review",
      metadata: { rating }
    });
  }

  async createChatNotification(
    userId: number,
    chatId: number,
    senderId: number,
    messagePreview: string
  ): Promise<Notification> {
    // Check if user has recent unread chat notifications to avoid spam
    const recentChatNotification = await this.notificationRepository.findOne({
      where: {
        user_id: userId,
        notification_type: "chat_message",
        related_chat_id: chatId,
        is_read: false,
        created_at: {
          $gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        } as any
      }
    });

    if (recentChatNotification) {
      // Update existing notification instead of creating new one
      await this.notificationRepository.update(recentChatNotification.id, {
        message: messagePreview.length > 100 ? 
          messagePreview.substring(0, 100) + "..." : messagePreview,
        created_at: new Date(),
        metadata: { messageCount: (recentChatNotification.metadata?.messageCount || 1) + 1 }
      });

      return await this.notificationRepository.findOne({
        where: { id: recentChatNotification.id },
        relations: ["user", "related_user"]
      }) as Notification;
    }

    return await this.createNotification({
      user_id: userId,
      title: "New Message",
      message: messagePreview.length > 100 ? 
        messagePreview.substring(0, 100) + "..." : messagePreview,
      notification_type: "chat_message",
      priority: "low",
      related_chat_id: chatId,
      related_user_id: senderId,
      action_url: `/chats/${chatId}`,
      action_text: "Reply",
      metadata: { messageCount: 1 }
    });
  }
}
