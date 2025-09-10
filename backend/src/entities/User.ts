import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index
} from "typeorm";
import { Resource } from "./Resource";
import { BorrowRequest } from "./BorrowRequest";
import { Chat } from "./Chat";
import { Message } from "./Message";
import { Review } from "./Review";
import { Notification } from "./Notification";

@Entity("users")
@Index(["latitude", "longitude"]) // For location-based queries
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  name!: string;

  @Column({ unique: true, length: 100 })
  email!: string;

  @Column()
  password!: string;

  @Column({ nullable: true, length: 15 })
  phone?: string;

  // Location fields for neighborhood verification
  @Column({ nullable: true, length: 255 })
  address?: string;

  @Column({ type: "decimal", precision: 10, scale: 8, nullable: true })
  latitude?: number;

  @Column({ type: "decimal", precision: 11, scale: 8, nullable: true })
  longitude?: number;

  @Column({ nullable: true, length: 100 })
  neighborhood?: string;

  @Column({ nullable: true, length: 10 })
  postal_code?: string;

  // Profile fields
  @Column({ nullable: true, length: 500 })
  bio?: string;

  @Column({ nullable: true, length: 255 })
  avatar_url?: string;

  // Verification and status
  @Column({ default: false })
  is_email_verified!: boolean;

  @Column({ default: false })
  is_location_verified!: boolean;

  @Column({ default: true })
  is_active!: boolean;

  @Column({ default: "pending" })
  verification_status!: string; // pending, verified, suspended

  // Authentication
  @Column({ nullable: true, length: 500 })
  refresh_token?: string;

  @Column({ type: "datetime", nullable: true })
  last_login?: Date;

  // Rating system
  @Column({ type: "decimal", precision: 3, scale: 2, default: 0 })
  average_rating!: number;

  @Column({ default: 0 })
  total_ratings!: number;

  // Activity counters
  @Column({ default: 0 })
  items_shared!: number;

  @Column({ default: 0 })
  successful_borrows!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Relations
  @OneToMany(() => Resource, (resource) => resource.owner)
  resources?: Resource[];

  @OneToMany(() => BorrowRequest, (request) => request.requester)
  borrow_requests?: BorrowRequest[];

  @OneToMany(() => Chat, (chat) => chat.user1)
  chats_as_user1?: Chat[];

  @OneToMany(() => Chat, (chat) => chat.user2)
  chats_as_user2?: Chat[];

  @OneToMany(() => Message, (message) => message.sender)
  messages?: Message[];

  @OneToMany(() => Review, (review) => review.reviewer)
  reviews_given?: Review[];

  @OneToMany(() => Review, (review) => review.reviewee)
  reviews_received?: Review[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications?: Notification[];
}
