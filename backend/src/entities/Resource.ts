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
import { ResourcePhoto } from "./ResourcePhoto";
import { BorrowRequest } from "./BorrowRequest";

@Entity("resources")
@Index(["category"]) // For category filtering
@Index(["is_available"]) // For availability filtering
@Index(["created_at"]) // For sorting by date
export class Resource {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 200 })
  title!: string;

  @Column("text")
  description!: string;

  @Column({ length: 50 })
  category!: string; // Tools, Books, Furniture, Electronics, Sports, etc.

  // Condition and value
  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  estimated_value?: number;

  @Column({ default: "good" })
  condition!: string; // excellent, good, fair, poor

  @Column({ nullable: true, length: 500 })
  condition_notes?: string;

  // Availability and borrowing terms
  @Column({ default: true })
  is_available!: boolean;

  @Column({ nullable: true })
  max_borrow_days?: number; // Maximum days item can be borrowed

  @Column({ type: "decimal", precision: 8, scale: 2, nullable: true })
  deposit_required?: number;

  @Column({ default: false })
  pickup_required!: boolean; // Must be picked up vs delivery possible

  @Column({ nullable: true, length: 500 })
  pickup_instructions?: string;

  @Column({ nullable: true, length: 500 })
  usage_instructions?: string;

  // Location and availability
  @Column({ nullable: true, length: 255 })
  location_notes?: string; // Specific pickup location within neighborhood

  @Column({ type: "json", nullable: true })
  available_days?: string[]; // Days of week when pickup is available

  @Column({ type: "time", nullable: true })
  available_time_start?: string;

  @Column({ type: "time", nullable: true })
  available_time_end?: string;

  // Tracking and analytics
  @Column({ default: 0 })
  views_count!: number;

  @Column({ default: 0 })
  borrow_count!: number;

  @Column({ type: "decimal", precision: 3, scale: 2, default: 0 })
  average_rating!: number;

  @Column({ default: 0 })
  total_ratings!: number;

  // Status tracking
  @Column({ default: "active" })
  status!: string; // active, borrowed, maintenance, inactive

  @Column({ type: "datetime", nullable: true })
  last_borrowed?: Date;

  @Column()
  owner_id!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.resources)
  @JoinColumn({ name: "owner_id" })
  owner?: User;

  @OneToMany(() => ResourcePhoto, (photo) => photo.resource)
  photos?: ResourcePhoto[];

  @OneToMany(() => BorrowRequest, (request) => request.resource)
  borrow_requests?: BorrowRequest[];
}
