import { Request, Response, NextFunction } from "express";
import { ResourceService } from "../services/ResourceService";
import { PhotoService, PhotoUploadResult } from "../services/PhotoService";
import {
  CreateResourceRequest,
  UpdateResourceRequest,
  ResourceQueryFilters,
  ApiResponse
} from "../types/resource";
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  NotFoundError
} from "../utils/errors";
import multer from "multer";
import * as fs from 'fs';

// Extend Express Request to include user information
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
  };
}

export class ResourceController {
  private resourceService: ResourceService;
  private photoService: PhotoService;

  constructor() {
    this.resourceService = new ResourceService();
    this.photoService = new PhotoService();
    
    // Bind methods to ensure correct 'this' context
    this.getResources = this.getResources.bind(this);
    this.getResourceById = this.getResourceById.bind(this);
    this.createResource = this.createResource.bind(this);
    this.updateResource = this.updateResource.bind(this);
    this.deleteResource = this.deleteResource.bind(this);
    this.getUserResources = this.getUserResources.bind(this);
    this.searchResources = this.searchResources.bind(this);
    this.getResourceCategories = this.getResourceCategories.bind(this);
    this.uploadPhotos = this.uploadPhotos.bind(this);
    this.deletePhoto = this.deletePhoto.bind(this);
    this.setPrimaryPhoto = this.setPrimaryPhoto.bind(this);
    this.reorderPhotos = this.reorderPhotos.bind(this);
    this.servePhoto = this.servePhoto.bind(this);
  }

  /**
   * GET /resources
   * Get paginated resources with optional filters and search
   */
  async getResources(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const currentUserId = authReq.user?.id;

      // Extract query parameters and build filters
      const filters: ResourceQueryFilters = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        category: req.query.category as string,
        search: req.query.search as string,
        condition: req.query.condition as string,
        sort_by: req.query.sort_by as 'created_at' | 'title' | 'estimated_value' | 'views_count' | 'average_rating',
        sort_order: req.query.sort_order as 'ASC' | 'DESC',
        min_value: req.query.min_value ? parseFloat(req.query.min_value as string) : undefined,
        max_value: req.query.max_value ? parseFloat(req.query.max_value as string) : undefined,
        max_borrow_days: req.query.max_borrow_days ? parseInt(req.query.max_borrow_days as string) : undefined,
        deposit_required: req.query.deposit_required ? req.query.deposit_required === 'true' : undefined,
        pickup_required: req.query.pickup_required ? req.query.pickup_required === 'true' : undefined,
        latitude: req.query.latitude ? parseFloat(req.query.latitude as string) : undefined,
        longitude: req.query.longitude ? parseFloat(req.query.longitude as string) : undefined,
        radius: req.query.radius ? parseFloat(req.query.radius as string) : 10
      };

      // Validate location parameters
      if ((filters.latitude && !filters.longitude) || (!filters.latitude && filters.longitude)) {
        throw new ValidationError('Both latitude and longitude must be provided for location-based search');
      }

      const result = await this.resourceService.getResources(filters, currentUserId);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /resources/search
   * Search resources with text query
   */
  async searchResources(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const currentUserId = authReq.user?.id;
      const query = req.query.q as string;

      if (!query) {
        throw new ValidationError('Search query is required');
      }

      // Extract additional filters
      const filters: ResourceQueryFilters = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        category: req.query.category as string,
        condition: req.query.condition as string,
        sort_by: req.query.sort_by as 'created_at' | 'title' | 'estimated_value' | 'views_count' | 'average_rating',
        sort_order: req.query.sort_order as 'ASC' | 'DESC',
        min_value: req.query.min_value ? parseFloat(req.query.min_value as string) : undefined,
        max_value: req.query.max_value ? parseFloat(req.query.max_value as string) : undefined,
        latitude: req.query.latitude ? parseFloat(req.query.latitude as string) : undefined,
        longitude: req.query.longitude ? parseFloat(req.query.longitude as string) : undefined,
        radius: req.query.radius ? parseFloat(req.query.radius as string) : 10
      };

      const result = await this.resourceService.searchResources(query, filters);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /resources/categories
   * Get all resource categories with their counts
   */
  async getResourceCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await this.resourceService.getResourceCategories();
      
      const response: ApiResponse<{ category: string; count: number }[]> = {
        success: true,
        data: categories,
        message: 'Categories retrieved successfully'
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /resources/:id
   * Get a single resource by ID
   */
  async getResourceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const currentUserId = authReq.user?.id;
      const resourceId = parseInt(req.params.id);

      if (isNaN(resourceId)) {
        throw new ValidationError('Invalid resource ID');
      }

      const resource = await this.resourceService.getResourceById(resourceId, currentUserId);
      
      const response: ApiResponse<typeof resource> = {
        success: true,
        data: resource,
        message: 'Resource retrieved successfully'
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /resources
   * Create a new resource (authenticated users only)
   */
  async createResource(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const resourceData: CreateResourceRequest = req.body;
      
      // Create the resource first
      const resource = await this.resourceService.createResource(resourceData, req.user.id);
      
      // Handle photo uploads if files are provided
      const files = req.files as Express.Multer.File[];
      if (files && files.length > 0) {
        try {
          await this.photoService.uploadPhotos(resource.id, files, req.user.id);
        } catch (photoError) {
          console.error('Photo upload error:', photoError);
          // Don't fail the entire request if photo upload fails
        }
      }
      
      const response: ApiResponse<typeof resource> = {
        success: true,
        data: resource,
        message: 'Resource created successfully'
      };
      
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /resources/:id
   * Update a resource (resource owner only)
   */
  async updateResource(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const resourceId = parseInt(req.params.id);
      if (isNaN(resourceId)) {
        throw new ValidationError('Invalid resource ID');
      }

      const updates: UpdateResourceRequest = req.body;
      
      // Ensure at least one field is being updated
      if (Object.keys(updates).length === 0) {
        throw new ValidationError('At least one field must be provided for update');
      }

      const resource = await this.resourceService.updateResource(resourceId, updates, req.user.id);
      
      const response: ApiResponse<typeof resource> = {
        success: true,
        data: resource,
        message: 'Resource updated successfully'
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /resources/:id
   * Delete a resource (resource owner only)
   */
  async deleteResource(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const resourceId = parseInt(req.params.id);
      if (isNaN(resourceId)) {
        throw new ValidationError('Invalid resource ID');
      }

      await this.resourceService.deleteResource(resourceId, req.user.id);
      
      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Resource deleted successfully'
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /resources/user/:userId
   * Get all resources owned by a specific user
   */
  async getUserResources(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        throw new ValidationError('Invalid user ID');
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.resourceService.getUserResources(userId, page, limit);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /my-resources
   * Get all resources owned by the authenticated user
   */
  async getMyResources(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.resourceService.getUserResources(req.user.id, page, limit);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /resources/:id/view
   * Record a view for a resource (for analytics)
   */
  async recordView(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const resourceId = parseInt(req.params.id);
      
      if (isNaN(resourceId)) {
        throw new ValidationError('Invalid resource ID');
      }

      // This will automatically increment the view count when we get the resource
      await this.resourceService.getResourceById(resourceId, authReq.user?.id);
      
      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'View recorded successfully'
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /resources/:id/availability
   * Toggle resource availability
   */
  async toggleAvailability(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const resourceId = parseInt(req.params.id);
      if (isNaN(resourceId)) {
        throw new ValidationError('Invalid resource ID');
      }

      const { is_available } = req.body;
      if (typeof is_available !== 'boolean') {
        throw new ValidationError('is_available must be a boolean value');
      }

      const resource = await this.resourceService.updateResource(
        resourceId,
        { is_available },
        req.user.id
      );
      
      const response: ApiResponse<typeof resource> = {
        success: true,
        data: resource,
        message: `Resource ${is_available ? 'activated' : 'deactivated'} successfully`
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /resources/nearby
   * Get resources near a specific location
   */
  async getNearbyResources(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const latitude = parseFloat(req.query.latitude as string);
      const longitude = parseFloat(req.query.longitude as string);
      const radius = parseFloat(req.query.radius as string) || 10;

      if (isNaN(latitude) || isNaN(longitude)) {
        throw new ValidationError('Valid latitude and longitude are required');
      }

      const filters: ResourceQueryFilters = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        latitude,
        longitude,
        radius,
        category: req.query.category as string,
        search: req.query.search as string,
        sort_by: 'created_at', // Default sort by distance (handled in service)
        sort_order: 'DESC'
      };

      const result = await this.resourceService.getResources(filters, authReq.user?.id);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /resources/:id/photos
   * Upload photos for a resource (resource owner only)
   */
  async uploadPhotos(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const resourceId = parseInt(req.params.id);
      if (isNaN(resourceId)) {
        throw new ValidationError('Invalid resource ID');
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        throw new ValidationError('At least one photo file is required');
      }

      const uploadResults = await this.photoService.uploadPhotos(resourceId, files, req.user.id);
      
      const response: ApiResponse<PhotoUploadResult[]> = {
        success: true,
        data: uploadResults,
        message: `${uploadResults.length} photo(s) uploaded successfully`
      };
      
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /resources/:resourceId/photos/:photoId
   * Delete a photo from a resource (resource owner only)
   */
  async deletePhoto(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const photoId = parseInt(req.params.photoId);
      if (isNaN(photoId)) {
        throw new ValidationError('Invalid photo ID');
      }

      await this.photoService.deletePhoto(photoId, req.user.id);
      
      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Photo deleted successfully'
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /resources/:id/photos/:photoId/primary
   * Set a photo as the primary photo for a resource (resource owner only)
   */
  async setPrimaryPhoto(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const photoId = parseInt(req.params.photoId);
      if (isNaN(photoId)) {
        throw new ValidationError('Invalid photo ID');
      }

      await this.photoService.setPrimaryPhoto(photoId, req.user.id);
      
      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Primary photo updated successfully'
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /resources/:id/photos/reorder
   * Reorder photos for a resource (resource owner only)
   */
  async reorderPhotos(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const resourceId = parseInt(req.params.id);
      if (isNaN(resourceId)) {
        throw new ValidationError('Invalid resource ID');
      }

      const { photoOrder } = req.body;
      if (!Array.isArray(photoOrder)) {
        throw new ValidationError('photoOrder must be an array of {id, order} objects');
      }

      await this.photoService.reorderPhotos(resourceId, photoOrder, req.user.id);
      
      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Photos reordered successfully'
      };
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /uploads/resources/:filename
   * Serve uploaded resource photos
   */
  async servePhoto(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filename = req.params.filename;
      
      if (!filename) {
        throw new ValidationError('Filename is required');
      }

      const filePath = await this.photoService.getPhotoPath(filename);
      
      // Set appropriate headers
      res.setHeader('Content-Type', 'image/*');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      
      fileStream.on('error', () => {
        throw new NotFoundError('Photo file');
      });
    } catch (error) {
      next(error);
    }
  }
}
