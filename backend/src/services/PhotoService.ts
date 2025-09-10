import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { ResourcePhoto } from "../entities/ResourcePhoto";
import { Resource } from "../entities/Resource";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError
} from "../utils/errors";
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

export interface PhotoUploadResult {
  id: number;
  filename: string;
  photo_url: string;
  file_size: number;
  display_order: number;
}

export class PhotoService {
  private photoRepository: Repository<ResourcePhoto>;
  private resourceRepository: Repository<Resource>;
  private uploadDir: string;

  constructor() {
    this.photoRepository = AppDataSource.getRepository(ResourcePhoto);
    this.resourceRepository = AppDataSource.getRepository(Resource);
    this.uploadDir = path.join(process.cwd(), 'uploads', 'resources');
    
    // Ensure upload directory exists
    this.ensureUploadDir();
  }

  /**
   * Upload photos for a resource
   */
  async uploadPhotos(
    resourceId: number,
    files: Express.Multer.File[],
    userId: number
  ): Promise<PhotoUploadResult[]> {
    // Verify resource exists and user owns it
    const resource = await this.resourceRepository.findOne({
      where: { id: resourceId },
      relations: ['photos']
    });

    if (!resource) {
      throw new NotFoundError('Resource');
    }

    if (resource.owner_id !== userId) {
      throw new UnauthorizedError('You can only upload photos to your own resources');
    }

    // Check photo limits
    const currentPhotoCount = resource.photos?.length || 0;
    const maxPhotos = 10; // Maximum photos per resource

    if (currentPhotoCount + files.length > maxPhotos) {
      throw new ValidationError(`Maximum ${maxPhotos} photos allowed per resource`);
    }

    // Process each file
    const uploadResults: PhotoUploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file
      this.validatePhotoFile(file);
      
      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const uniqueFilename = `${randomUUID()}${fileExtension}`;
      const filePath = path.join(this.uploadDir, uniqueFilename);
      
      // Save file to disk
      await fs.promises.writeFile(filePath, file.buffer);
      
      // Create database record
      const photo = this.photoRepository.create({
        resource_id: resourceId,
        photo_filename: uniqueFilename,
        photo_url: `/uploads/resources/${uniqueFilename}`,
        file_size: file.size,
        display_order: currentPhotoCount + i + 1,
        mime_type: file.mimetype
      });
      
      const savedPhoto = await this.photoRepository.save(photo);
      
      uploadResults.push({
        id: savedPhoto.id,
        filename: savedPhoto.photo_filename!,
        photo_url: savedPhoto.photo_url,
        file_size: savedPhoto.file_size || 0,
        display_order: savedPhoto.display_order
      });
    }

    return uploadResults;
  }

  /**
   * Get photos for a resource
   */
  async getResourcePhotos(resourceId: number): Promise<ResourcePhoto[]> {
    return await this.photoRepository.find({
      where: { resource_id: resourceId },
      order: { display_order: 'ASC' }
    });
  }

  /**
   * Delete a photo
   */
  async deletePhoto(photoId: number, userId: number): Promise<void> {
    const photo = await this.photoRepository.findOne({
      where: { id: photoId },
      relations: ['resource']
    });

    if (!photo) {
      throw new NotFoundError('Photo');
    }

    if (photo.resource!.owner_id !== userId) {
      throw new UnauthorizedError('You can only delete photos from your own resources');
    }

    // Delete file from disk
    const filePath = path.join(this.uploadDir, photo.photo_filename!);
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      console.warn(`Failed to delete photo file: ${filePath}`, error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await this.photoRepository.remove(photo);
  }

  /**
   * Reorder photos for a resource
   */
  async reorderPhotos(
    resourceId: number,
    photoOrder: { id: number; order: number }[],
    userId: number
  ): Promise<void> {
    // Verify resource ownership
    const resource = await this.resourceRepository.findOne({
      where: { id: resourceId }
    });

    if (!resource) {
      throw new NotFoundError('Resource');
    }

    if (resource.owner_id !== userId) {
      throw new UnauthorizedError('You can only reorder photos for your own resources');
    }

    // Get all photos for the resource
    const photos = await this.photoRepository.find({
      where: { resource_id: resourceId }
    });

    // Validate all photo IDs belong to this resource
    const photoIds = photos.map(p => p.id);
    const requestedIds = photoOrder.map(p => p.id);
    
    const invalidIds = requestedIds.filter(id => !photoIds.includes(id));
    if (invalidIds.length > 0) {
      throw new ValidationError(`Invalid photo IDs: ${invalidIds.join(', ')}`);
    }

    // Update photo orders
    for (const orderItem of photoOrder) {
      await this.photoRepository.update(
        { id: orderItem.id },
        { display_order: orderItem.order }
      );
    }
  }

  /**
   * Set a photo as the primary photo (order = 1)
   */
  async setPrimaryPhoto(photoId: number, userId: number): Promise<void> {
    const photo = await this.photoRepository.findOne({
      where: { id: photoId },
      relations: ['resource']
    });

    if (!photo) {
      throw new NotFoundError('Photo');
    }

    if (photo.resource!.owner_id !== userId) {
      throw new UnauthorizedError('You can only modify photos for your own resources');
    }

    // Get all photos for the resource
    const allPhotos = await this.photoRepository.find({
      where: { resource_id: photo.resource_id },
      order: { display_order: 'ASC' }
    });

    // Reorder: move selected photo to position 1, shift others
    for (let i = 0; i < allPhotos.length; i++) {
      const currentPhoto = allPhotos[i];
      
      if (currentPhoto.id === photoId) {
        // Set as primary
        await this.photoRepository.update({ id: photoId }, { display_order: 1 });
      } else {
        // Shift others up by 1
        const newOrder = currentPhoto.display_order >= 1 ? currentPhoto.display_order + 1 : currentPhoto.display_order;
        await this.photoRepository.update({ id: currentPhoto.id }, { display_order: newOrder });
      }
    }
  }

  /**
   * Clean up orphaned photos (photos without resources)
   */
  async cleanupOrphanedPhotos(): Promise<number> {
    const orphanedPhotos = await this.photoRepository
      .createQueryBuilder('photo')
      .leftJoin('photo.resource', 'resource')
      .where('resource.id IS NULL')
      .getMany();

    let cleanedCount = 0;
    
    for (const photo of orphanedPhotos) {
      try {
        // Delete file from disk
        const filePath = path.join(this.uploadDir, photo.photo_filename!);
        await fs.promises.unlink(filePath);
        
        // Delete from database
        await this.photoRepository.remove(photo);
        cleanedCount++;
      } catch (error) {
        console.warn(`Failed to cleanup orphaned photo ${photo.id}:`, error);
      }
    }

    return cleanedCount;
  }

  /**
   * Get photo by filename (for serving files)
   */
  async getPhotoPath(filename: string): Promise<string> {
    const filePath = path.join(this.uploadDir, filename);
    
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      return filePath;
    } catch {
      throw new NotFoundError('Photo file');
    }
  }

  private validatePhotoFile(file: Express.Multer.File): void {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new ValidationError('Photo file size cannot exceed 10MB');
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new ValidationError('Only JPEG, PNG, and WebP images are allowed');
    }

    // Check filename length
    if (file.originalname.length > 255) {
      throw new ValidationError('Filename is too long');
    }
  }

  private ensureUploadDir(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }
}
