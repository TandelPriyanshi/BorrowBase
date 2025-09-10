import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { BorrowRequest, BorrowRequestStatus } from "../entities/BorrowRequest";
import { Resource } from "../entities/Resource";
import { User } from "../entities/User";
import { 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError, 
  ConflictError 
} from "../utils/errors";
import { NotificationService } from "./NotificationService";

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface BorrowRequestCreateData {
  resource_id: number;
  requester_id: number;
  start_date: Date;
  end_date: Date;
  message?: string;
  pickup_location?: string;
  return_location?: string;
}

export interface BorrowRequestUpdateData {
  status?: BorrowRequestStatus;
  response_message?: string;
  pickup_notes?: string;
  return_notes?: string;
  issue_description?: string;
  has_issues?: boolean;
  issue_resolved?: boolean;
  deposit_paid?: boolean;
  deposit_returned?: boolean;
}

export class BorrowRequestService {
  private borrowRequestRepository: Repository<BorrowRequest>;
  private resourceRepository: Repository<Resource>;
  private userRepository: Repository<User>;
  private notificationService: NotificationService;

  constructor() {
    this.borrowRequestRepository = AppDataSource.getRepository(BorrowRequest);
    this.resourceRepository = AppDataSource.getRepository(Resource);
    this.userRepository = AppDataSource.getRepository(User);
    this.notificationService = new NotificationService();
  }

  /**
   * Create a new borrow request
   */
  async createBorrowRequest(data: BorrowRequestCreateData): Promise<BorrowRequest> {
    // Validate dates
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      throw new ValidationError("Start date cannot be in the past");
    }

    if (endDate <= startDate) {
      throw new ValidationError("End date must be after start date");
    }

    // Check if resource exists and is available
    const resource = await this.resourceRepository.findOne({
      where: { id: data.resource_id },
      relations: ["owner"]
    });

    if (!resource) {
      throw new NotFoundError("Resource");
    }

    if (!resource.is_available) {
      throw new ConflictError("Resource is not available for borrowing");
    }

    if (resource.owner_id === data.requester_id) {
      throw new ValidationError("Cannot borrow your own resource");
    }

    // Check if user exists
    const requester = await this.userRepository.findOne({
      where: { id: data.requester_id }
    });

    if (!requester) {
      throw new NotFoundError("User");
    }

    // Check for conflicting requests (overlapping dates for the same resource)
    const conflictingRequest = await this.borrowRequestRepository
      .createQueryBuilder("request")
      .where("request.resource_id = :resourceId", { resourceId: data.resource_id })
      .andWhere("request.status IN (:...statuses)", { 
        statuses: ["pending", "approved", "active"] 
      })
      .andWhere(
        "(request.start_date <= :endDate AND request.end_date >= :startDate)",
        { startDate: data.start_date, endDate: data.end_date }
      )
      .getOne();

    if (conflictingRequest) {
      throw new ConflictError("Resource is already requested for the selected dates");
    }

    // Create the borrow request
    const borrowRequest = this.borrowRequestRepository.create({
      ...data,
      status: "pending",
      requested_at: new Date(),
      due_date: endDate
    });

    const savedRequest = await this.borrowRequestRepository.save(borrowRequest);

    // Create notification for resource owner
    try {
      await this.notificationService.createBorrowRequestNotification(
        resource.owner_id,
        "created",
        savedRequest.id,
        data.requester_id,
        {
          resource_name: resource.title,
          requester_name: requester.name,
          start_date: data.start_date,
          end_date: data.end_date
        }
      );
    } catch (error) {
      console.warn("Failed to create notification:", error);
      // Don't fail the request if notification creation fails
    }

    // Return with relations
    return await this.borrowRequestRepository.findOne({
      where: { id: savedRequest.id },
      relations: ["resource", "resource.owner", "resource.photos", "requester"]
    }) as BorrowRequest;
  }

  /**
   * Get borrow requests made by a user (as requester)
   */
  async getUserRequests(
    userId: number,
    page: number = 1,
    limit: number = 10,
    status?: BorrowRequestStatus
  ): Promise<PaginatedResponse<BorrowRequest>> {
    const queryBuilder = this.borrowRequestRepository
      .createQueryBuilder("request")
      .leftJoinAndSelect("request.resource", "resource")
      .leftJoinAndSelect("resource.owner", "owner")
      .leftJoinAndSelect("resource.photos", "photos")
      .leftJoinAndSelect("request.requester", "requester")
      .where("request.requester_id = :userId", { userId })
      .orderBy("request.created_at", "DESC");

    if (status) {
      queryBuilder.andWhere("request.status = :status", { status });
    }

    const [requests, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get borrow requests for resources owned by a user
   */
  async getResourceRequests(
    userId: number,
    page: number = 1,
    limit: number = 10,
    status?: BorrowRequestStatus
  ): Promise<PaginatedResponse<BorrowRequest>> {
    const queryBuilder = this.borrowRequestRepository
      .createQueryBuilder("request")
      .leftJoinAndSelect("request.resource", "resource")
      .leftJoinAndSelect("resource.owner", "owner")
      .leftJoinAndSelect("resource.photos", "photos")
      .leftJoinAndSelect("request.requester", "requester")
      .where("resource.owner_id = :userId", { userId })
      .orderBy("request.created_at", "DESC");

    if (status) {
      queryBuilder.andWhere("request.status = :status", { status });
    }

    const [requests, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get a specific borrow request by ID
   */
  async getBorrowRequestById(id: number, userId: number): Promise<BorrowRequest> {
    const request = await this.borrowRequestRepository.findOne({
      where: { id },
      relations: ["resource", "resource.owner", "resource.photos", "requester", "reviews"]
    });

    if (!request) {
      throw new NotFoundError("Borrow request");
    }

    // Check if user has access to this request
    if (request.requester_id !== userId && request.resource?.owner_id !== userId) {
      throw new UnauthorizedError("Not authorized to view this request");
    }

    return request;
  }

  /**
   * Update borrow request status (approve/reject by owner)
   */
  async updateRequestStatus(
    requestId: number,
    status: "approved" | "rejected",
    userId: number,
    responseMessage?: string
  ): Promise<BorrowRequest> {
    const request = await this.borrowRequestRepository.findOne({
      where: { id: requestId },
      relations: ["resource", "resource.owner", "requester"]
    });

    if (!request) {
      throw new NotFoundError("Borrow request");
    }

    if (request.resource?.owner_id !== userId) {
      throw new UnauthorizedError("Only resource owner can update request status");
    }

    if (request.status !== "pending") {
      throw new ConflictError("Request has already been processed");
    }

    // Update the request
    const updateData: Partial<BorrowRequest> = {
      status,
      response_message: responseMessage,
      responded_at: new Date()
    };

    await this.borrowRequestRepository.update(requestId, updateData);

    // If approved, mark resource as temporarily unavailable
    if (status === "approved") {
      await this.resourceRepository.update(request.resource_id, {
        is_available: false
      });
    }

    // Create notification for requester
    try {
      await this.notificationService.createBorrowRequestNotification(
        request.requester_id,
        status === "approved" ? "approved" : "rejected",
        requestId,
        userId,
        {
          resource_name: request.resource?.title,
          owner_name: request.resource?.owner?.name,
          response_message: responseMessage
        }
      );
    } catch (error) {
      console.warn("Failed to create notification:", error);
    }

    return await this.borrowRequestRepository.findOne({
      where: { id: requestId },
      relations: ["resource", "resource.owner", "resource.photos", "requester"]
    }) as BorrowRequest;
  }

  /**
   * Cancel a borrow request (by requester)
   */
  async cancelRequest(requestId: number, userId: number): Promise<BorrowRequest> {
    const request = await this.borrowRequestRepository.findOne({
      where: { id: requestId },
      relations: ["resource", "requester"]
    });

    if (!request) {
      throw new NotFoundError("Borrow request");
    }

    if (request.requester_id !== userId) {
      throw new UnauthorizedError("Only the requester can cancel this request");
    }

    if (!["pending", "approved"].includes(request.status)) {
      throw new ConflictError("Request cannot be cancelled in current status");
    }

    await this.borrowRequestRepository.update(requestId, {
      status: "cancelled" as BorrowRequestStatus,
      updated_at: new Date()
    });

    // If it was approved, make resource available again
    if (request.status === "approved") {
      await this.resourceRepository.update(request.resource_id, {
        is_available: true
      });
    }

    // Create notification for resource owner
    try {
      await this.notificationService.createBorrowRequestNotification(
        request.resource?.owner_id!,
        "cancelled",
        requestId,
        userId,
        {
          resource_name: request.resource?.title,
          requester_name: request.requester?.name
        }
      );
    } catch (error) {
      console.warn("Failed to create notification:", error);
    }

    return await this.borrowRequestRepository.findOne({
      where: { id: requestId },
      relations: ["resource", "resource.owner", "resource.photos", "requester"]
    }) as BorrowRequest;
  }

  /**
   * Mark request as picked up (transition to active)
   */
  async markAsPickedUp(
    requestId: number,
    userId: number,
    pickupNotes?: string
  ): Promise<BorrowRequest> {
    const request = await this.borrowRequestRepository.findOne({
      where: { id: requestId },
      relations: ["resource", "resource.owner"]
    });

    if (!request) {
      throw new NotFoundError("Borrow request");
    }

    if (request.resource?.owner_id !== userId) {
      throw new UnauthorizedError("Only resource owner can mark as picked up");
    }

    if (request.status !== "approved") {
      throw new ConflictError("Request must be approved before pickup");
    }

    await this.borrowRequestRepository.update(requestId, {
      status: "active" as BorrowRequestStatus,
      pickup_notes: pickupNotes,
      picked_up_at: new Date()
    });

    return await this.borrowRequestRepository.findOne({
      where: { id: requestId },
      relations: ["resource", "resource.owner", "resource.photos", "requester"]
    }) as BorrowRequest;
  }

  /**
   * Mark request as returned (transition to completed)
   */
  async markAsReturned(
    requestId: number,
    userId: number,
    returnNotes?: string,
    hasIssues: boolean = false,
    issueDescription?: string
  ): Promise<BorrowRequest> {
    const request = await this.borrowRequestRepository.findOne({
      where: { id: requestId },
      relations: ["resource", "resource.owner"]
    });

    if (!request) {
      throw new NotFoundError("Borrow request");
    }

    if (request.resource?.owner_id !== userId) {
      throw new UnauthorizedError("Only resource owner can mark as returned");
    }

    if (request.status !== "active") {
      throw new ConflictError("Request must be active to mark as returned");
    }

    const updateData: Partial<BorrowRequest> = {
      status: "returned" as BorrowRequestStatus,
      return_notes: returnNotes,
      returned_at: new Date(),
      has_issues: hasIssues
    };

    if (hasIssues && issueDescription) {
      updateData.issue_description = issueDescription;
      updateData.issue_reported_at = new Date();
    }

    await this.borrowRequestRepository.update(requestId, updateData);

    // Make resource available again
    await this.resourceRepository.update(request.resource_id, {
      is_available: true
    });

    return await this.borrowRequestRepository.findOne({
      where: { id: requestId },
      relations: ["resource", "resource.owner", "resource.photos", "requester"]
    }) as BorrowRequest;
  }

  /**
   * Get overdue requests
   */
  async getOverdueRequests(): Promise<BorrowRequest[]> {
    const now = new Date();
    
    const overdueRequests = await this.borrowRequestRepository
      .createQueryBuilder("request")
      .leftJoinAndSelect("request.resource", "resource")
      .leftJoinAndSelect("request.requester", "requester")
      .where("request.status = :status", { status: "active" })
      .andWhere("request.due_date < :now", { now })
      .getMany();

    // Update status to overdue
    if (overdueRequests.length > 0) {
      await this.borrowRequestRepository
        .createQueryBuilder()
        .update(BorrowRequest)
        .set({ status: "overdue" as BorrowRequestStatus })
        .where("id IN (:...ids)", { ids: overdueRequests.map(r => r.id) })
        .execute();

      // Create overdue notifications
      for (const request of overdueRequests) {
        try {
          await this.notificationService.createBorrowRequestNotification(
            request.requester_id,
            "overdue",
            request.id,
            request.resource?.owner_id,
            {
              resource_name: request.resource?.title,
              due_date: request.due_date,
              days_overdue: request.due_date ? Math.ceil((now.getTime() - request.due_date.getTime()) / (1000 * 60 * 60 * 24)) : 0
            }
          );
        } catch (error) {
          console.warn(`Failed to create overdue notification for request ${request.id}:`, error);
        }
      }
    }

    return overdueRequests;
  }

  /**
   * Get request statistics for a user
   */
  async getUserStats(userId: number): Promise<{
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    activeRequests: number;
    completedRequests: number;
    resourcesLent: number;
    resourcesBorrowed: number;
  }> {
    // Requests made by user
    const userRequests = await this.borrowRequestRepository
      .createQueryBuilder("request")
      .select("request.status", "status")
      .addSelect("COUNT(*)", "count")
      .where("request.requester_id = :userId", { userId })
      .groupBy("request.status")
      .getRawMany();

    // Requests for user's resources
    const resourceRequests = await this.borrowRequestRepository
      .createQueryBuilder("request")
      .leftJoin("request.resource", "resource")
      .select("COUNT(*)", "count")
      .where("resource.owner_id = :userId", { userId })
      .andWhere("request.status IN (:...statuses)", { 
        statuses: ["completed", "returned"] 
      })
      .getRawOne();

    const stats = {
      totalRequests: 0,
      pendingRequests: 0,
      approvedRequests: 0,
      activeRequests: 0,
      completedRequests: 0,
      resourcesLent: parseInt(resourceRequests?.count || 0),
      resourcesBorrowed: 0
    };

    userRequests.forEach(req => {
      const count = parseInt(req.count);
      stats.totalRequests += count;
      
      switch (req.status) {
        case "pending":
          stats.pendingRequests = count;
          break;
        case "approved":
          stats.approvedRequests = count;
          break;
        case "active":
          stats.activeRequests = count;
          break;
        case "completed":
        case "returned":
          stats.completedRequests += count;
          stats.resourcesBorrowed += count;
          break;
      }
    });

    return stats;
  }

  /**
   * Update request with additional data
   */
  async updateBorrowRequest(
    requestId: number,
    userId: number,
    data: BorrowRequestUpdateData
  ): Promise<BorrowRequest> {
    const request = await this.borrowRequestRepository.findOne({
      where: { id: requestId },
      relations: ["resource", "resource.owner", "requester"]
    });

    if (!request) {
      throw new NotFoundError("Borrow request");
    }

    // Check authorization
    const isOwner = request.resource?.owner_id === userId;
    const isRequester = request.requester_id === userId;

    if (!isOwner && !isRequester) {
      throw new UnauthorizedError("Not authorized to update this request");
    }

    // Validate what can be updated by whom
    const allowedUpdates: Partial<BorrowRequest> = {};

    if (data.pickup_notes && isOwner) {
      allowedUpdates.pickup_notes = data.pickup_notes;
    }

    if (data.return_notes && isOwner) {
      allowedUpdates.return_notes = data.return_notes;
    }

    if (data.issue_description && (isOwner || isRequester)) {
      allowedUpdates.issue_description = data.issue_description;
      allowedUpdates.has_issues = true;
      allowedUpdates.issue_reported_at = new Date();
    }

    if (data.has_issues === false && isOwner) {
      allowedUpdates.issue_resolved = true;
      allowedUpdates.has_issues = false;
    }

    if (data.deposit_paid !== undefined && isRequester) {
      allowedUpdates.deposit_paid = data.deposit_paid;
    }

    if (data.deposit_returned !== undefined && isOwner) {
      allowedUpdates.deposit_returned = data.deposit_returned;
    }

    if (Object.keys(allowedUpdates).length === 0) {
      throw new ValidationError("No valid updates provided");
    }

    await this.borrowRequestRepository.update(requestId, allowedUpdates);

    return await this.borrowRequestRepository.findOne({
      where: { id: requestId },
      relations: ["resource", "resource.owner", "resource.photos", "requester"]
    }) as BorrowRequest;
  }
}
