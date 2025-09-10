import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from "typeorm";
import { User } from "./User";

@Entity("notifications")
@Index(["user_id"]) // For getting notifications for a specific user
@Index(["is_read"]) // For filtering unread notifications
@Index(["created_at"]) // For sorting by date
@Index(["notification_type"]) // For filtering by type
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  user_id!: number;

  // Notification content
  @Column({ length: 255 })
  title!: string;

  @Column("text")
  message!: string;

  @Column()
  notification_type!: string; // borrow_request, request_approved, request_rejected, etc.

  // Status and interaction
  @Column({ default: false })
  is_read!: boolean;

  @Column({ type: "datetime", nullable: true })
  read_at?: Date;

  @Column({ default: "normal" })
  priority!: string; // low, normal, high, urgent

  // Related entities (optional)
  @Column({ nullable: true })
  related_resource_id?: number;

  @Column({ nullable: true })
  related_borrow_request_id?: number;

  @Column({ nullable: true })
  related_chat_id?: number;

  @Column({ nullable: true })
  related_review_id?: number;

  @Column({ nullable: true })
  related_user_id?: number; // User who triggered the notification

  // Action data
  @Column({ nullable: true, length: 255 })
  action_url?: string; // Deep link or URL to relevant page

  @Column({ nullable: true, length: 100 })
  action_text?: string; // Button text like "View Request", "Reply", etc.

  @Column({ type: "json", nullable: true })
  metadata?: Record<string, any>; // Additional data for the notification

  // Delivery tracking
  @Column({ default: false })
  is_push_sent!: boolean;

  @Column({ default: false })
  is_email_sent!: boolean;

  @Column({ default: false })
  is_sms_sent!: boolean;

  @Column({ type: "datetime", nullable: true })
  push_sent_at?: Date;

  @Column({ type: "datetime", nullable: true })
  email_sent_at?: Date;

  @Column({ type: "datetime", nullable: true })
  sms_sent_at?: Date;

  // Scheduling
  @Column({ type: "datetime", nullable: true })
  scheduled_for?: Date; // For delayed notifications

  @Column({ default: false })
  is_sent!: boolean;

  // Expiration
  @Column({ type: "datetime", nullable: true })
  expires_at?: Date; // When notification becomes irrelevant

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.notifications, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user?: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "related_user_id" })
  related_user?: User;
}
