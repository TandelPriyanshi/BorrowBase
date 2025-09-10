import { Request, Response } from "express";
import { BorrowRequestService } from "../services/BorrowRequestService";
import { AuthenticatedRequest } from "../types/auth";
import { handleControllerError } from "../utils/errors";

export class BorrowRequestController {
  private borrowRequestService: BorrowRequestService;

  constructor() {
    this.borrowRequestService = new BorrowRequestService();
  }

  /**
   * Create a new borrow request
   * POST /api/borrow-requests
   */
  async createBorrowRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          message: "User not authenticated",
          success: false
        });
        return;
      }

      const {
        resource_id,
        start_date,
        end_date,
        message,
        pickup_location,
        return_location
      } = req.body;

      // Validation
      if (!resource_id) {
        res.status(400).json({
          message: "Resource ID is required",
          success: false
        });
        return;
      }

      if (!start_date || !end_date) {
        res.status(400).json({
          message: "Start date and end date are required",
          success: false
        });
        return;
      }

      const borrowRequest = await this.borrowRequestService.createBorrowRequest({
        resource_id: parseInt(resource_id),
        requester_id: req.user.id,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        message,
        pickup_location,
        return_location
      });

      res.status(201).json({
        data: borrowRequest,
        message: "Borrow request created successfully",
        success: true
      });
    } catch (error: any) {
      handleControllerError(error, res);
    }
  }

  /**
   * Get borrow requests made by the authenticated user
   * GET /api/my-requests
   */
  async getMyRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          message: "User not authenticated",
          success: false
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
      const status = req.query.status as string;

      const result = await this.borrowRequestService.getUserRequests(
        req.user.id,
        page,
        limit,
        status as any
      );

      res.json({
        data: result.data,
        pagination: result.pagination,
        message: "User requests retrieved successfully",
        success: true
      });
    } catch (error: any) {
      handleControllerError(error, res);
    }
  }

  /**
   * Get borrow requests for resources owned by the authenticated user
   * GET /api/resource-requests
   */
  async getResourceRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          message: "User not authenticated",
          success: false
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
      const status = req.query.status as string;

      const result = await this.borrowRequestService.getResourceRequests(
        req.user.id,
        page,
        limit,
        status as any
      );

      res.json({
        data: result.data,
        pagination: result.pagination,
        message: "Resource requests retrieved successfully",
        success: true
      });
    } catch (error: any) {
      handleControllerError(error, res);
    }
  }

  /**
   * Get a specific borrow request by ID
   * GET /api/borrow-requests/:id
   */
  async getBorrowRequestById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          message: "User not authenticated",
          success: false
        });
        return;
      }

      const { id } = req.params;
      const requestId = parseInt(id);

      if (isNaN(requestId)) {
        res.status(400).json({
          message: "Invalid request ID",
          success: false
        });
        return;
      }

      const borrowRequest = await this.borrowRequestService.getBorrowRequestById(
        requestId,
        req.user.id
      );

      res.json({
        data: borrowRequest,
        message: "Borrow request retrieved successfully",
        success: true
      });
    } catch (error: any) {
      handleControllerError(error, res);
    }
  }

  /**
   * Update borrow request status (approve/reject)
   * PUT /api/borrow-requests/:id/status
   */
  async updateRequestStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          message: "User not authenticated",
          success: false
        });
        return;
      }

      const { id } = req.params;
      const { status, response_message } = req.body;
      const requestId = parseInt(id);

      if (isNaN(requestId)) {
        res.status(400).json({
          message: "Invalid request ID",
          success: false
        });
        return;
      }

      if (!status || !["approved", "rejected"].includes(status)) {
        res.status(400).json({
          message: "Status must be 'approved' or 'rejected'",
          success: false
        });
        return;
      }

      const borrowRequest = await this.borrowRequestService.updateRequestStatus(
        requestId,
        status,
        req.user.id,
        response_message
      );

      res.json({
        data: borrowRequest,
        message: `Request ${status} successfully`,
        success: true
      });
    } catch (error: any) {
      handleControllerError(error, res);
    }
  }

  /**
   * Cancel a borrow request
   * PUT /api/borrow-requests/:id/cancel
   */
  async cancelRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          message: "User not authenticated",
          success: false
        });
        return;
      }

      const { id } = req.params;
      const requestId = parseInt(id);

      if (isNaN(requestId)) {
        res.status(400).json({
          message: "Invalid request ID",
          success: false
        });
        return;
      }

      const borrowRequest = await this.borrowRequestService.cancelRequest(
        requestId,
        req.user.id
      );

      res.json({
        data: borrowRequest,
        message: "Request cancelled successfully",
        success: true
      });
    } catch (error: any) {
      handleControllerError(error, res);
    }
  }

  /**
   * Mark request as picked up
   * PUT /api/borrow-requests/:id/pickup
   */
  async markAsPickedUp(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          message: "User not authenticated",
          success: false
        });
        return;
      }

      const { id } = req.params;
      const { pickup_notes } = req.body;
      const requestId = parseInt(id);

      if (isNaN(requestId)) {
        res.status(400).json({
          message: "Invalid request ID",
          success: false
        });
        return;
      }

      const borrowRequest = await this.borrowRequestService.markAsPickedUp(
        requestId,
        req.user.id,
        pickup_notes
      );

      res.json({
        data: borrowRequest,
        message: "Request marked as picked up successfully",
        success: true
      });
    } catch (error: any) {
      handleControllerError(error, res);
    }
  }

  /**
   * Mark request as returned
   * PUT /api/borrow-requests/:id/return
   */
  async markAsReturned(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          message: "User not authenticated",
          success: false
        });
        return;
      }

      const { id } = req.params;
      const { return_notes, has_issues, issue_description } = req.body;
      const requestId = parseInt(id);

      if (isNaN(requestId)) {
        res.status(400).json({
          message: "Invalid request ID",
          success: false
        });
        return;
      }

      const borrowRequest = await this.borrowRequestService.markAsReturned(
        requestId,
        req.user.id,
        return_notes,
        has_issues || false,
        issue_description
      );

      res.json({
        data: borrowRequest,
        message: "Request marked as returned successfully",
        success: true
      });
    } catch (error: any) {
      handleControllerError(error, res);
    }
  }

  /**
   * Update borrow request with additional information
   * PUT /api/borrow-requests/:id
   */
  async updateBorrowRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          message: "User not authenticated",
          success: false
        });
        return;
      }

      const { id } = req.params;
      const requestId = parseInt(id);

      if (isNaN(requestId)) {
        res.status(400).json({
          message: "Invalid request ID",
          success: false
        });
        return;
      }

      const {
        pickup_notes,
        return_notes,
        issue_description,
        has_issues,
        deposit_paid,
        deposit_returned
      } = req.body;

      const borrowRequest = await this.borrowRequestService.updateBorrowRequest(
        requestId,
        req.user.id,
        {
          pickup_notes,
          return_notes,
          issue_description,
          has_issues,
          deposit_paid,
          deposit_returned
        }
      );

      res.json({
        data: borrowRequest,
        message: "Borrow request updated successfully",
        success: true
      });
    } catch (error: any) {
      handleControllerError(error, res);
    }
  }

  /**
   * Get overdue requests (admin/system endpoint)
   * GET /api/borrow-requests/overdue
   */
  async getOverdueRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          message: "User not authenticated",
          success: false
        });
        return;
      }

      const overdueRequests = await this.borrowRequestService.getOverdueRequests();

      res.json({
        data: overdueRequests,
        message: "Overdue requests retrieved successfully",
        success: true
      });
    } catch (error: any) {
      handleControllerError(error, res);
    }
  }

  /**
   * Get user statistics
   * GET /api/borrow-requests/stats
   */
  async getUserStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          message: "User not authenticated",
          success: false
        });
        return;
      }

      const stats = await this.borrowRequestService.getUserStats(req.user.id);

      res.json({
        data: stats,
        message: "User statistics retrieved successfully",
        success: true
      });
    } catch (error: any) {
      handleControllerError(error, res);
    }
  }
}
