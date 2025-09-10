import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from "typeorm";
import { User } from "./User";
import { BorrowRequest } from "./BorrowRequest";

@Entity("reviews")
@Index(["reviewee_id"]) // For getting reviews for a specific user
@Index(["reviewer_id"]) // For getting reviews by a specific user
@Index(["borrow_request_id"]) // For getting reviews for a specific transaction
@Index(["rating"]) // For filtering by rating
export class Review {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    reviewer_id!: number; // User giving the review

    @Column()
    reviewee_id!: number; // User being reviewed

    @Column({ nullable: true })
    borrow_request_id?: number; // The transaction being reviewed (optional for general reviews)

    // Rating and feedback
    @Column({ type: "decimal", precision: 2, scale: 1 })
    rating!: number; // 1.0 to 5.0

    @Column({ nullable: true, length: 1000 })
    comment?: string;

    // Review categories for detailed feedback
    @Column({ type: "decimal", precision: 2, scale: 1, nullable: true })
    communication_rating?: number;

    @Column({ type: "decimal", precision: 2, scale: 1, nullable: true })
    reliability_rating?: number;

    @Column({ type: "decimal", precision: 2, scale: 1, nullable: true })
    item_condition_rating?: number; // For item owner reviews

    @Column({ type: "decimal", precision: 2, scale: 1, nullable: true })
    care_rating?: number; // For borrower reviews (how well they took care of item)

    // Review type and context
    @Column()
    review_type!: string; // borrower_to_owner, owner_to_borrower

    @Column({ default: false })
    is_anonymous!: boolean;

    @Column({ default: false })
    is_verified!: boolean; // Admin verified review

    // Moderation
    @Column({ default: false })
    is_flagged!: boolean;

    @Column({ nullable: true, length: 500 })
    flag_reason?: string;

    @Column({ default: false })
    is_hidden!: boolean; // Hidden by admin

    @Column({ type: "datetime", nullable: true })
    moderated_at?: Date;

    @Column({ nullable: true })
    moderated_by?: number;

    // Response from reviewee
    @Column({ nullable: true, length: 1000 })
    response?: string;

    @Column({ type: "datetime", nullable: true })
    response_at?: Date;

    // Helpful votes (community feedback on review quality)
    @Column({ default: 0 })
    helpful_votes!: number;

    @Column({ default: 0 })
    total_votes!: number;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;

    // Relations
    @ManyToOne(() => User, (user) => user.reviews_given)
    @JoinColumn({ name: "reviewer_id" })
    reviewer?: User;

    @ManyToOne(() => User, (user) => user.reviews_received)
    @JoinColumn({ name: "reviewee_id" })
    reviewee?: User;

    @ManyToOne(() => BorrowRequest, (request) => request.reviews)
    @JoinColumn({ name: "borrow_request_id" })
    borrow_request?: BorrowRequest;
}
