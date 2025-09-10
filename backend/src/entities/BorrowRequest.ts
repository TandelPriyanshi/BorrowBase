import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index
} from "typeorm";
import { User } from "./User";
import { Resource } from "./Resource";
import { Review } from "./Review";

export type BorrowRequestStatus = 
  | "pending" 
  | "approved" 
  | "rejected" 
  | "cancelled" 
  | "active" 
  | "returned" 
  | "overdue"
  | "completed";

@Entity("borrow_requests")
@Index(["status"]) // For filtering by status
@Index(["resource_id"]) // For resource-specific queries
@Index(["requester_id"]) // For user-specific queries
@Index(["start_date", "end_date"]) // For date range queries
export class BorrowRequest {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  resource_id!: number;

  @Column()
  requester_id!: number;

  // Request details
  @Column({ type: "date" })
  start_date!: Date;

  @Column({ type: "date" })
  end_date!: Date;

  @Column({ nullable: true, length: 1000 })
  message?: string; // Message from requester

  @Column({ default: "pending" })
  status!: BorrowRequestStatus; // pending, approved, rejected, cancelled, active, returned, overdue, completed

  @Column({ nullable: true, length: 1000 })
  response_message?: string; // Owner's response

  // Deposit and terms
  @Column({ type: "decimal", precision: 8, scale: 2, nullable: true })
  deposit_amount?: number;

  @Column({ default: false })
  deposit_paid!: boolean;

  @Column({ default: false })
  deposit_returned!: boolean;

  // Timing tracking
  @Column({ type: "datetime", nullable: true })
  requested_at?: Date;

  @Column({ type: "datetime", nullable: true })
  responded_at?: Date;

  @Column({ type: "datetime", nullable: true })
  picked_up_at?: Date;

  @Column({ type: "datetime", nullable: true })
  returned_at?: Date;

  @Column({ type: "datetime", nullable: true })
  due_date?: Date;

  // Pickup/return details
  @Column({ nullable: true, length: 500 })
  pickup_notes?: string;

  @Column({ nullable: true, length: 500 })
  return_notes?: string;

  @Column({ nullable: true, length: 255 })
  pickup_location?: string;

  @Column({ nullable: true, length: 255 })
  return_location?: string;

  // Issue tracking
  @Column({ default: false })
  has_issues!: boolean;

  @Column({ nullable: true, length: 1000 })
  issue_description?: string;

  @Column({ type: "datetime", nullable: true })
  issue_reported_at?: Date;

  @Column({ default: false })
  issue_resolved!: boolean;

  // Emergency contact
  @Column({ nullable: true, length: 15 })
  emergency_contact?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Relations
  @ManyToOne(() => Resource, (resource) => resource.borrow_requests)
  @JoinColumn({ name: "resource_id" })
  resource?: Resource;

  @ManyToOne(() => User, (user) => user.borrow_requests)
  @JoinColumn({ name: "requester_id" })
  requester?: User;

  @OneToMany(() => Review, (review) => review.borrow_request)
  reviews?: Review[];
}
