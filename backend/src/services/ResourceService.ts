import { Repository, SelectQueryBuilder } from "typeorm";
import { AppDataSource } from "../config/database";
import { Resource } from "../entities/Resource";
import { ResourcePhoto } from "../entities/ResourcePhoto";
import { User } from "../entities/User";
import {
  CreateResourceRequest,
  UpdateResourceRequest,
  ResourceQueryFilters,
  ResourceWithOwner,
  ResourceWithFullOwner,
  PaginatedResourceResponse,
  RESOURCE_CATEGORIES,
  RESOURCE_CONDITIONS,
  RESOURCE_STATUSES,
  RESOURCE_VALIDATION
} from "../types/resource";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  validateRequired,
  validateLength,
  validateNumber,
  validateEnum,
  validateBoolean,
  validateArray,
  validatePagination
} from "../utils/errors";

export class ResourceService {
  private resourceRepository: Repository<Resource>;
  private photoRepository: Repository<ResourcePhoto>;
  private userRepository: Repository<User>;

  constructor() {
    this.resourceRepository = AppDataSource.getRepository(Resource);
    this.photoRepository = AppDataSource.getRepository(ResourcePhoto);
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * Create a new resource
   */
  async createResource(data: CreateResourceRequest, userId: number): Promise<ResourceWithFullOwner> {
    // Validate input data
    this.validateResourceData(data);

    // Check if user exists and is active
    const user = await this.userRepository.findOne({
      where: { id: userId, is_active: true }
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Create resource
    const resource = this.resourceRepository.create({
      ...data,
      owner_id: userId,
      is_available: true,
      status: 'active',
      views_count: 0,
      borrow_count: 0,
      average_rating: 0,
      total_ratings: 0
    });

    const savedResource = await this.resourceRepository.save(resource);

    // Increment user's items shared count
    await this.userRepository.increment({ id: userId }, 'items_shared', 1);

    // Return with owner data
    return this.getResourceWithFullOwner(savedResource.id, userId);
  }

  /**
   * Get paginated resources with filters and search
   */
  async getResources(filters: ResourceQueryFilters, currentUserId?: number): Promise<PaginatedResourceResponse> {
    // Validate pagination
    validatePagination(filters.page, filters.limit);

    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 10, 50); // Max 50 items per page
    const skip = (page - 1) * limit;

    // Build query
    let query = this.resourceRepository
      .createQueryBuilder('resource')
      .leftJoinAndSelect('resource.owner', 'owner')
      .leftJoinAndSelect('resource.photos', 'photos')
      .where('resource.is_available = :isAvailable', { isAvailable: true })
      .andWhere('resource.status = :status', { status: 'active' })
      .andWhere('owner.is_active = :userActive', { userActive: true });

    // Apply filters
    query = this.applyFilters(query, filters);

    // Apply location-based filtering and sorting
    if (filters.latitude && filters.longitude) {
      query = this.applyLocationFilter(query, filters.latitude, filters.longitude, filters.radius);
    }

    // Apply sorting
    const sortBy = filters.sort_by || 'created_at';
    const sortOrder = filters.sort_order || 'DESC';
    
    if (sortBy === 'created_at') {
      query.orderBy('resource.created_at', sortOrder);
    } else if (sortBy === 'title') {
      query.orderBy('resource.title', sortOrder);
    } else if (sortBy === 'estimated_value') {
      query.orderBy('resource.estimated_value', sortOrder);
    } else if (sortBy === 'views_count') {
      query.orderBy('resource.views_count', sortOrder);
    } else if (sortBy === 'average_rating') {
      query.orderBy('resource.average_rating', sortOrder);
    }

    // Add secondary sort by creation date
    if (sortBy !== 'created_at') {
      query.addOrderBy('resource.created_at', 'DESC');
    }

    // Get total count
    const total = await query.getCount();

    // Apply pagination
    query.skip(skip).take(limit);

    // Execute query
    const resources = await query.getMany();

    // Transform to ResourceWithOwner format
    const transformedResources: ResourceWithOwner[] = await Promise.all(
      resources.map(async (resource) => {
        const transformed = await this.transformToResourceWithOwner(resource, currentUserId, filters.latitude, filters.longitude);
        return transformed;
      })
    );

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    
    return {
      data: transformedResources,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        category: filters.category,
        search: filters.search,
        ...(filters.latitude && filters.longitude && {
          location: {
            latitude: filters.latitude,
            longitude: filters.longitude,
            radius: filters.radius || 10
          }
        })
      },
      success: true
    };
  }

  /**
   * Get resource by ID with full details
   */
  async getResourceById(id: number, currentUserId?: number): Promise<ResourceWithFullOwner> {
    const resource = await this.resourceRepository
      .createQueryBuilder('resource')
      .leftJoinAndSelect('resource.owner', 'owner')
      .leftJoinAndSelect('resource.photos', 'photos')
      .where('resource.id = :id', { id })
      .andWhere('owner.is_active = :userActive', { userActive: true })
      .getOne();

    if (!resource) {
      throw new NotFoundError('Resource');
    }

    // Increment view count (don't count owner's views)
    if (currentUserId !== resource.owner_id) {
      await this.resourceRepository.increment({ id }, 'views_count', 1);
      resource.views_count += 1;
    }

    return this.transformToResourceWithFullOwner(resource, currentUserId);
  }

  /**
   * Update resource
   */
  async updateResource(id: number, updates: UpdateResourceRequest, userId: number): Promise<ResourceWithFullOwner> {
    // Find resource
    const resource = await this.resourceRepository.findOne({
      where: { id },
      relations: ['owner']
    });

    if (!resource) {
      throw new NotFoundError('Resource');
    }

    // Check ownership
    if (resource.owner_id !== userId) {
      throw new UnauthorizedError('You can only update your own resources');
    }

    // Validate updates
    if (Object.keys(updates).length > 0) {
      this.validateResourceUpdateData(updates);
    }

    // Apply updates
    Object.assign(resource, updates);
    
    const updatedResource = await this.resourceRepository.save(resource);

    return this.getResourceWithFullOwner(updatedResource.id, userId);
  }

  /**
   * Delete resource
   */
  async deleteResource(id: number, userId: number): Promise<void> {
    const resource = await this.resourceRepository.findOne({
      where: { id },
      relations: ['owner']
    });

    if (!resource) {
      throw new NotFoundError('Resource');
    }

    if (resource.owner_id !== userId) {
      throw new UnauthorizedError('You can only delete your own resources');
    }

    // Check if resource is currently borrowed
    if (resource.status === 'borrowed') {
      throw new ValidationError('Cannot delete a resource that is currently borrowed');
    }

    // Soft delete - mark as inactive instead of hard delete
    await this.resourceRepository.update(id, { 
      status: 'inactive',
      is_available: false 
    });

    // Decrement user's items shared count
    await this.userRepository.decrement({ id: userId }, 'items_shared', 1);
  }

  /**
   * Get user's resources
   */
  async getUserResources(userId: number, page: number = 1, limit: number = 10): Promise<PaginatedResourceResponse> {
    validatePagination(page, limit);

    limit = Math.min(limit, 50);
    const skip = (page - 1) * limit;

    const [resources, total] = await this.resourceRepository
      .createQueryBuilder('resource')
      .leftJoinAndSelect('resource.photos', 'photos')
      .leftJoinAndSelect('resource.owner', 'owner')
      .where('resource.owner_id = :userId', { userId })
      .andWhere('resource.status != :status', { status: 'inactive' })
      .orderBy('resource.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const transformedResources: ResourceWithOwner[] = await Promise.all(
      resources.map(resource => this.transformToResourceWithOwner(resource, userId))
    );

    const totalPages = Math.ceil(total / limit);

    return {
      data: transformedResources,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      success: true
    };
  }

  /**
   * Search resources with text search
   */
  async searchResources(query: string, filters: ResourceQueryFilters = {}): Promise<PaginatedResourceResponse> {
    if (!query || query.trim().length < 2) {
      throw new ValidationError('Search query must be at least 2 characters long');
    }

    const searchFilters: ResourceQueryFilters = {
      ...filters,
      search: query.trim()
    };

    return this.getResources(searchFilters);
  }

  /**
   * Get resource categories with counts
   */
  async getResourceCategories(): Promise<{ category: string; count: number }[]> {
    const categories = await this.resourceRepository
      .createQueryBuilder('resource')
      .select('resource.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('resource.is_available = :isAvailable', { isAvailable: true })
      .andWhere('resource.status = :status', { status: 'active' })
      .groupBy('resource.category')
      .orderBy('count', 'DESC')
      .getRawMany();

    return categories.map(cat => ({
      category: cat.category,
      count: parseInt(cat.count)
    }));
  }

  // Private helper methods
  private validateResourceData(data: CreateResourceRequest): void {
    validateRequired(data.title, 'title');
    validateRequired(data.description, 'description');
    validateRequired(data.category, 'category');

    validateLength(data.title, 'title', RESOURCE_VALIDATION.title.min, RESOURCE_VALIDATION.title.max);
    validateLength(data.description, 'description', RESOURCE_VALIDATION.description.min, RESOURCE_VALIDATION.description.max);
    validateEnum(data.category, 'category', RESOURCE_CATEGORIES, true);

    if (data.condition) {
      validateEnum(data.condition, 'condition', RESOURCE_CONDITIONS);
    }

    if (data.estimated_value !== undefined) {
      validateNumber(data.estimated_value, 'estimated_value', RESOURCE_VALIDATION.estimated_value.min, RESOURCE_VALIDATION.estimated_value.max);
    }

    if (data.max_borrow_days !== undefined) {
      validateNumber(data.max_borrow_days, 'max_borrow_days', RESOURCE_VALIDATION.max_borrow_days.min, RESOURCE_VALIDATION.max_borrow_days.max);
    }

    if (data.deposit_required !== undefined) {
      validateNumber(data.deposit_required, 'deposit_required', RESOURCE_VALIDATION.deposit_required.min, RESOURCE_VALIDATION.deposit_required.max);
    }

    if (data.pickup_required !== undefined) {
      validateBoolean(data.pickup_required, 'pickup_required');
    }

    if (data.available_days !== undefined) {
      validateArray(data.available_days, 'available_days', 1, 7);
    }
  }

  private validateResourceUpdateData(data: UpdateResourceRequest): void {
    if (data.title !== undefined) {
      validateLength(data.title, 'title', RESOURCE_VALIDATION.title.min, RESOURCE_VALIDATION.title.max);
    }

    if (data.description !== undefined) {
      validateLength(data.description, 'description', RESOURCE_VALIDATION.description.min, RESOURCE_VALIDATION.description.max);
    }

    if (data.category !== undefined) {
      validateEnum(data.category, 'category', RESOURCE_CATEGORIES, true);
    }

    if (data.condition !== undefined) {
      validateEnum(data.condition, 'condition', RESOURCE_CONDITIONS);
    }

    if (data.status !== undefined) {
      validateEnum(data.status, 'status', RESOURCE_STATUSES);
    }

    if (data.estimated_value !== undefined) {
      validateNumber(data.estimated_value, 'estimated_value', RESOURCE_VALIDATION.estimated_value.min, RESOURCE_VALIDATION.estimated_value.max);
    }

    if (data.is_available !== undefined) {
      validateBoolean(data.is_available, 'is_available');
    }
  }

  private applyFilters(query: SelectQueryBuilder<Resource>, filters: ResourceQueryFilters): SelectQueryBuilder<Resource> {
    // Category filter
    if (filters.category) {
      query.andWhere('resource.category = :category', { category: filters.category });
    }

    // Search filter (title and description)
    if (filters.search) {
      query.andWhere(
        '(LOWER(resource.title) LIKE LOWER(:search) OR LOWER(resource.description) LIKE LOWER(:search))',
        { search: `%${filters.search}%` }
      );
    }

    // Condition filter
    if (filters.condition) {
      query.andWhere('resource.condition = :condition', { condition: filters.condition });
    }

    // Value range filters
    if (filters.min_value !== undefined) {
      query.andWhere('resource.estimated_value >= :minValue', { minValue: filters.min_value });
    }

    if (filters.max_value !== undefined) {
      query.andWhere('resource.estimated_value <= :maxValue', { maxValue: filters.max_value });
    }

    // Borrow days filter
    if (filters.max_borrow_days !== undefined) {
      query.andWhere('(resource.max_borrow_days IS NULL OR resource.max_borrow_days <= :maxBorrowDays)', 
        { maxBorrowDays: filters.max_borrow_days });
    }

    // Deposit filter
    if (filters.deposit_required !== undefined) {
      if (filters.deposit_required) {
        query.andWhere('resource.deposit_required > 0');
      } else {
        query.andWhere('(resource.deposit_required IS NULL OR resource.deposit_required = 0)');
      }
    }

    // Pickup filter
    if (filters.pickup_required !== undefined) {
      query.andWhere('resource.pickup_required = :pickupRequired', { pickupRequired: filters.pickup_required });
    }

    return query;
  }

  private applyLocationFilter(
    query: SelectQueryBuilder<Resource>,
    userLat: number,
    userLng: number,
    radius: number = 10
  ): SelectQueryBuilder<Resource> {
    // Add distance calculation using Haversine formula
    query
      .addSelect(`(
        6371 * acos(
          cos(radians(:userLat)) * cos(radians(owner.latitude)) *
          cos(radians(owner.longitude) - radians(:userLng)) +
          sin(radians(:userLat)) * sin(radians(owner.latitude))
        )
      )`, 'distance')
      .andWhere('owner.latitude IS NOT NULL')
      .andWhere('owner.longitude IS NOT NULL')
      .having('distance <= :radius')
      .setParameters({ userLat, userLng, radius })
      .orderBy('distance', 'ASC');

    return query;
  }

  private async transformToResourceWithOwner(
    resource: Resource,
    currentUserId?: number,
    userLat?: number,
    userLng?: number
  ): Promise<ResourceWithOwner> {
    const transformed: ResourceWithOwner = {
      ...resource,
      owner: {
        id: resource.owner!.id,
        name: resource.owner!.name,
        average_rating: resource.owner!.average_rating,
        total_ratings: resource.owner!.total_ratings,
        is_location_verified: resource.owner!.is_location_verified,
        neighborhood: resource.owner!.neighborhood
      },
      photos: resource.photos || []
    };

    // Calculate distance if user location provided
    if (userLat && userLng && resource.owner!.latitude && resource.owner!.longitude) {
      transformed.distance = this.calculateDistance(
        userLat,
        userLng,
        resource.owner!.latitude,
        resource.owner!.longitude
      );
    }

    return transformed;
  }

  private transformToResourceWithFullOwner(
    resource: Resource,
    currentUserId?: number
  ): ResourceWithFullOwner {
    const { password, refresh_token, email, ...ownerData } = resource.owner!;
    
    return {
      ...resource,
      owner: ownerData,
      photos: resource.photos || [],
      can_edit: currentUserId === resource.owner_id
    };
  }

  private async getResourceWithFullOwner(id: number, currentUserId?: number): Promise<ResourceWithFullOwner> {
    const resource = await this.resourceRepository
      .createQueryBuilder('resource')
      .leftJoinAndSelect('resource.owner', 'owner')
      .leftJoinAndSelect('resource.photos', 'photos')
      .where('resource.id = :id', { id })
      .getOne();

    if (!resource) {
      throw new NotFoundError('Resource');
    }

    return this.transformToResourceWithFullOwner(resource, currentUserId);
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return parseFloat(distance.toFixed(2));
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
