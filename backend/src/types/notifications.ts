// Common notification types
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

// Interfaces for notification data
export interface NotificationBase {
  id: number;
  user_id: number;
  title: string;
  message: string;
  notification_type: NotificationType;
  priority: NotificationPriority;
  is_read: boolean;
  is_sent: boolean;
  created_at: Date;
  updated_at: Date;
  read_at?: Date;
}

export interface NotificationCreatePayload {
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

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

export interface BorrowRequestNotificationData {
  resource_name?: string;
  requester_name?: string;
  owner_name?: string;
  start_date?: Date;
  end_date?: Date;
  due_date?: Date;
  days_overdue?: number;
  response_message?: string;
}

export interface ReviewNotificationData {
  rating?: number;
  reviewer_name?: string;
  reviewee_name?: string;
  comment_preview?: string;
}

export interface ChatNotificationData {
  sender_name?: string;
  message_preview?: string;
  messageCount?: number;
}

// Socket.IO notification events
export interface NotificationSocketEvents {
  new_notification: NotificationBase;
  notification_read: { notificationId: number; userId: number };
  unread_count_updated: { userId: number; count: number };
  system_announcement: {
    title: string;
    message: string;
    priority: NotificationPriority;
    timestamp: Date;
  };
  notifications_cleaned: {
    deletedCount: number;
    timestamp: Date;
  };
}

// API Response types
export interface NotificationResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export interface PaginatedNotificationResponse {
  success: boolean;
  data: {
    notifications: NotificationBase[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    unread_count: number;
  };
}

// Notification preferences
export interface NotificationPreferences {
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  borrow_requests: boolean;
  reviews: boolean;
  messages: boolean;
  system_announcements: boolean;
  marketing: boolean;
}

// Filter options for notifications
export interface NotificationFilters {
  unread_only?: boolean;
  notification_type?: NotificationType;
  priority?: NotificationPriority;
  page?: number;
  limit?: number;
  include_expired?: boolean;
  start_date?: Date;
  end_date?: Date;
}

// Bulk notification operations
export interface BulkNotificationPayload {
  user_ids: number[];
  title: string;
  message: string;
  notification_type: NotificationType;
  priority?: NotificationPriority;
  expires_at?: Date;
  scheduled_for?: Date;
  metadata?: Record<string, any>;
}

// Notification delivery tracking
export interface DeliveryMethods {
  push?: boolean;
  email?: boolean;
  sms?: boolean;
}

export interface NotificationDeliveryStatus {
  is_push_sent?: boolean;
  push_sent_at?: Date;
  is_email_sent?: boolean;
  email_sent_at?: Date;
  is_sms_sent?: boolean;
  sms_sent_at?: Date;
}

// Template data interfaces
export interface TemplateData {
  [key: string]: any;
}

export interface NotificationTemplate {
  title: string;
  message: string;
  action_text?: string;
  action_url?: string;
}

// Notification queue item
export interface QueuedNotification {
  notification: NotificationCreatePayload;
  scheduled_for?: Date;
  retry_count: number;
  max_retries: number;
}

// System notification types
export interface SystemAnnouncementData {
  title: string;
  message: string;
  priority: NotificationPriority;
  target_users?: number[];
  expires_at?: Date;
}

// Export all types for convenience
export type {
  NotificationBase as Notification,
  NotificationCreatePayload as CreateNotification,
  NotificationResponse as ApiResponse,
};
