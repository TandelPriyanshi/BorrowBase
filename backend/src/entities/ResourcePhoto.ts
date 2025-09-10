import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from "typeorm";
import { Resource } from "./Resource";

@Entity("resource_photos")
@Index(["resource_id"]) // For efficient photo queries per resource
export class ResourcePhoto {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  resource_id!: number;

  @Column({ length: 500 })
  photo_url!: string;

  @Column({ length: 255, nullable: true })
  photo_filename?: string;

  @Column({ default: false })
  is_primary!: boolean; // Main photo to show in listings

  @Column({ nullable: true, length: 255 })
  alt_text?: string; // For accessibility

  @Column({ nullable: true })
  file_size?: number; // In bytes

  @Column({ nullable: true, length: 10 })
  mime_type?: string; // image/jpeg, image/png, etc.

  @Column({ nullable: true })
  width?: number;

  @Column({ nullable: true })
  height?: number;

  @Column({ default: 0 })
  display_order!: number; // Order to display photos

  @CreateDateColumn()
  created_at!: Date;

  // Relations
  @ManyToOne(() => Resource, (resource) => resource.photos, { onDelete: "CASCADE" })
  @JoinColumn({ name: "resource_id" })
  resource?: Resource;
}
