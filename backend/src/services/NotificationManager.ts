import { Server } from "socket.io";
import { NotificationService } from "./NotificationService";
import { Notification } from "../entities/Notification";

export interface NotificationEvents {
  new_notification: Notification;
  notification_read: { notificationId: number; userId: number };
  unread_count_updated: { userId: number; count: number };
}

export class NotificationManager {
  private io: Server;
  private notificationService: NotificationService;

  constructor(io: Server) {
    this.io = io;
    this.notificationService = new NotificationService();
  }

  /**
   * Send a notification to a specific user in real-time
   */
  async sendNotificationToUser(userId: number, notification: Notification): Promise<void> {
    try {
      const userRoom = `user_${userId}`;
      
      // Emit to the user's room
      this.io.to(userRoom).emit("new_notification", notification);

      console.log(`📱 Notification sent to user ${userId} in room ${userRoom}`);

      // Also update their unread count
      const unreadCount = await this.notificationService.getUnreadCount(userId);
      this.io.to(userRoom).emit("unread_count_updated", {
        userId,
        count: unreadCount
      });

    } catch (error) {
      console.error(`Failed to send notification to user ${userId}:`, error);
    }
  }

  /**
   * Send bulk notifications to multiple users
   */
  async sendBulkNotifications(userIds: number[], notification: Omit<Notification, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      // Send to each user in parallel
      const promises = userIds.map(userId => {
        const userNotification = {
          ...notification,
          user_id: userId
        } as Notification;
        
        return this.sendNotificationToUser(userId, userNotification);
      });

      await Promise.all(promises);
      console.log(`📱 Bulk notifications sent to ${userIds.length} users`);
    } catch (error) {
      console.error("Failed to send bulk notifications:", error);
    }
  }

  /**
   * Notify when a notification is read
   */
  async notifyNotificationRead(userId: number, notificationId: number): Promise<void> {
    try {
      const userRoom = `user_${userId}`;
      
      this.io.to(userRoom).emit("notification_read", {
        notificationId,
        userId
      });

      // Update unread count
      const unreadCount = await this.notificationService.getUnreadCount(userId);
      this.io.to(userRoom).emit("unread_count_updated", {
        userId,
        count: unreadCount
      });

      console.log(`📖 Notification ${notificationId} marked as read for user ${userId}`);
    } catch (error) {
      console.error(`Failed to notify notification read for user ${userId}:`, error);
    }
  }

  /**
   * Send system-wide announcement
   */
  async sendSystemAnnouncement(
    title: string, 
    message: string, 
    priority: "low" | "normal" | "high" | "urgent" = "normal",
    targetUserIds?: number[]
  ): Promise<void> {
    try {
      if (targetUserIds && targetUserIds.length > 0) {
        // Send to specific users
        const notifications = await this.notificationService.createBulkNotifications(
          targetUserIds,
          {
            title,
            message,
            notification_type: "system_announcement",
            priority,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          }
        );

        // Send real-time notifications
        for (const notification of notifications) {
          await this.sendNotificationToUser(notification.user_id, notification);
        }

        console.log(`📢 System announcement sent to ${targetUserIds.length} specific users`);
      } else {
        // Send to all connected users
        this.io.emit("system_announcement", {
          title,
          message,
          priority,
          timestamp: new Date()
        });

        console.log("📢 System announcement broadcasted to all users");
      }
    } catch (error) {
      console.error("Failed to send system announcement:", error);
    }
  }

  /**
   * Create and send borrow request notification
   */
  async createAndSendBorrowRequestNotification(
    userId: number,
    type: "created" | "approved" | "rejected" | "cancelled" | "overdue",
    borrowRequestId: number,
    relatedUserId?: number,
    additionalData?: Record<string, any>
  ): Promise<void> {
    try {
      const notification = await this.notificationService.createBorrowRequestNotification(
        userId,
        type,
        borrowRequestId,
        relatedUserId,
        additionalData
      );

      await this.sendNotificationToUser(userId, notification);
      console.log(`📦 Borrow request ${type} notification sent to user ${userId}`);
    } catch (error) {
      console.error(`Failed to create and send borrow request notification:`, error);
    }
  }

  /**
   * Create and send review notification
   */
  async createAndSendReviewNotification(
    userId: number,
    type: "received" | "response",
    reviewId: number,
    relatedUserId?: number,
    rating?: number
  ): Promise<void> {
    try {
      const notification = await this.notificationService.createReviewNotification(
        userId,
        type,
        reviewId,
        relatedUserId,
        rating
      );

      await this.sendNotificationToUser(userId, notification);
      console.log(`⭐ Review ${type} notification sent to user ${userId}`);
    } catch (error) {
      console.error(`Failed to create and send review notification:`, error);
    }
  }

  /**
   * Create and send chat notification
   */
  async createAndSendChatNotification(
    userId: number,
    chatId: number,
    senderId: number,
    messagePreview: string
  ): Promise<void> {
    try {
      const notification = await this.notificationService.createChatNotification(
        userId,
        chatId,
        senderId,
        messagePreview
      );

      await this.sendNotificationToUser(userId, notification);
      console.log(`💬 Chat notification sent to user ${userId} for chat ${chatId}`);
    } catch (error) {
      console.error(`Failed to create and send chat notification:`, error);
    }
  }

  /**
   * Process scheduled notifications (to be called by a cron job)
   */
  async processScheduledNotifications(): Promise<void> {
    try {
      const scheduledNotifications = await this.notificationService.getScheduledNotificationsForSending();

      for (const notification of scheduledNotifications) {
        // Send real-time notification
        await this.sendNotificationToUser(notification.user_id, notification);

        // Mark as sent
        await this.notificationService.markAsSent(notification.id, {
          push: true
        });
      }

      if (scheduledNotifications.length > 0) {
        console.log(`📅 Processed ${scheduledNotifications.length} scheduled notifications`);
      }
    } catch (error) {
      console.error("Failed to process scheduled notifications:", error);
    }
  }

  /**
   * Send overdue reminders
   */
  async sendOverdueReminders(): Promise<void> {
    try {
      // This would be called by a scheduled job
      // For now, we'll implement basic overdue logic
      
      console.log("📝 Processing overdue reminders...");
      // Implementation would depend on your business logic
      // e.g., remind users about overdue items, upcoming due dates, etc.
      
    } catch (error) {
      console.error("Failed to send overdue reminders:", error);
    }
  }

  /**
   * Get connected user count
   */
  getConnectedUserCount(): number {
    return this.io.engine.clientsCount;
  }

  /**
   * Get users in a specific room
   */
  async getUsersInRoom(roomName: string): Promise<string[]> {
    const sockets = await this.io.in(roomName).fetchSockets();
    return sockets.map(socket => socket.id);
  }

  /**
   * Send notification to specific socket
   */
  sendToSocket(socketId: string, event: string, data: any): void {
    this.io.to(socketId).emit(event, data);
  }

  /**
   * Send notification to room
   */
  sendToRoom(roomName: string, event: string, data: any): void {
    this.io.to(roomName).emit(event, data);
  }

  /**
   * Clean up expired notifications and update users
   */
  async cleanupExpiredNotifications(): Promise<void> {
    try {
      const deletedCount = await this.notificationService.cleanupExpiredNotifications();
      
      if (deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deletedCount} expired notifications`);
        
        // Notify all connected users to refresh their notification counts
        this.io.emit("notifications_cleaned", {
          deletedCount,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error("Failed to cleanup expired notifications:", error);
    }
  }

  /**
   * Handle user connection
   */
  handleUserConnection(socket: any, userId: number): void {
    const userRoom = `user_${userId}`;
    socket.join(userRoom);
    
    console.log(`👤 User ${userId} connected to notification room ${userRoom}`);

    // Send current unread count
    this.notificationService.getUnreadCount(userId)
      .then(count => {
        socket.emit("unread_count_updated", {
          userId,
          count
        });
      })
      .catch(error => {
        console.error(`Failed to send unread count to user ${userId}:`, error);
      });
  }

  /**
   * Handle user disconnection
   */
  handleUserDisconnection(socket: any, userId: number): void {
    const userRoom = `user_${userId}`;
    socket.leave(userRoom);
    
    console.log(`👤 User ${userId} disconnected from notification room ${userRoom}`);
  }

  /**
   * Send test notification (for testing purposes)
   */
  async sendTestNotification(userId: number): Promise<void> {
    try {
      const notification = await this.notificationService.createNotification({
        user_id: userId,
        title: "Test Notification",
        message: "This is a test notification from the system.",
        notification_type: "system_announcement",
        priority: "normal"
      });

      await this.sendNotificationToUser(userId, notification);
      console.log(`🧪 Test notification sent to user ${userId}`);
    } catch (error) {
      console.error(`Failed to send test notification to user ${userId}:`, error);
    }
  }
}
