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
import { Message } from "./Message";

@Entity("chats")
@Index(["user1_id", "user2_id"]) // For finding chats between two users
@Index(["updated_at"]) // For sorting by most recent activity
export class Chat {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  user1_id!: number;

  @Column()
  user2_id!: number;

  // Chat metadata
  @Column({ nullable: true, length: 255 })
  subject?: string; // Optional chat subject (e.g., "About [Resource Name]")

  @Column({ nullable: true })
  resource_id?: number; // Optional: if chat is about a specific resource

  @Column({ default: "active" })
  status!: string; // active, archived, blocked

  // Last message info for efficient display
  @Column({ nullable: true, length: 500 })
  last_message?: string;

  @Column({ type: "datetime", nullable: true })
  last_message_at?: Date;

  @Column({ nullable: true })
  last_message_sender_id?: number;

  // Read status
  @Column({ default: false })
  user1_has_unread!: boolean;

  @Column({ default: false })
  user2_has_unread!: boolean;

  @Column({ default: 0 })
  user1_unread_count!: number;

  @Column({ default: 0 })
  user2_unread_count!: number;

  // Archive/mute settings
  @Column({ default: false })
  user1_archived!: boolean;

  @Column({ default: false })
  user2_archived!: boolean;

  @Column({ default: false })
  user1_muted!: boolean;

  @Column({ default: false })
  user2_muted!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.chats_as_user1)
  @JoinColumn({ name: "user1_id" })
  user1?: User;

  @ManyToOne(() => User, (user) => user.chats_as_user2)
  @JoinColumn({ name: "user2_id" })
  user2?: User;

  @OneToMany(() => Message, (message) => message.chat)
  messages?: Message[];
}
