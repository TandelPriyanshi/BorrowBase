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
import { Chat } from "./Chat";
import { User } from "./User";

@Entity("messages")
@Index(["chat_id"]) // For efficient message queries per chat
@Index(["created_at"]) // For sorting messages by time
@Index(["sender_id"]) // For sender-specific queries
export class Message {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  chat_id!: number;

  @Column()
  sender_id!: number;

  // Message content
  @Column("text")
  content!: string;

  @Column({ default: "text" })
  message_type!: string; // text, image, file, system

  // File/image metadata (if applicable)
  @Column({ nullable: true, length: 500 })
  file_url?: string;

  @Column({ nullable: true, length: 255 })
  file_name?: string;

  @Column({ nullable: true })
  file_size?: number;

  @Column({ nullable: true, length: 10 })
  mime_type?: string;

  // Message status
  @Column({ default: false })
  is_read!: boolean;

  @Column({ type: "datetime", nullable: true })
  read_at?: Date;

  @Column({ default: false })
  is_edited!: boolean;

  @Column({ type: "datetime", nullable: true })
  edited_at?: Date;

  @Column({ default: false })
  is_deleted!: boolean;

  @Column({ type: "datetime", nullable: true })
  deleted_at?: Date;

  // Reply functionality
  @Column({ nullable: true })
  reply_to_message_id?: number;

  @Column({ nullable: true, length: 200 })
  reply_preview?: string; // Short preview of the message being replied to

  // System message metadata
  @Column({ nullable: true, length: 100 })
  system_action?: string; // For system messages like "User joined", "Request approved", etc.

  @Column({ type: "json", nullable: true })
  metadata?: Record<string, any>; // Additional data for system messages or special content

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // Relations
  @ManyToOne(() => Chat, (chat) => chat.messages, { onDelete: "CASCADE" })
  @JoinColumn({ name: "chat_id" })
  chat?: Chat;

  @ManyToOne(() => User, (user) => user.messages)
  @JoinColumn({ name: "sender_id" })
  sender?: User;

  // Self-referencing for reply functionality
  @ManyToOne(() => Message, { nullable: true })
  @JoinColumn({ name: "reply_to_message_id" })
  reply_to_message?: Message;
}
