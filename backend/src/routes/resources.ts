import express from "express";
import multer from "multer";
import { ResourceController } from "../controllers/ResourceController";
import { ValidationMiddleware, SanitizationMiddleware } from "../middleware/validation";
import { authenticateToken } from "../middleware/auth";
import { RESOURCE_CATEGORIES, RESOURCE_CONDITIONS } from "../types/resource";

const router = express.Router();
const resourceController = new ResourceController();

// Configure multer for photo uploads
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory for processing
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files per upload
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      const error = new Error('Only image files are allowed') as any;
      cb(error, false);
    }
  }
});

// Apply sanitization to all routes
router.use(SanitizationMiddleware.sanitizeStrings());

// Public routes (no authentication required)

/**
 * GET /resources
 * Get paginated resources with optional filters
 * Query params: page, limit, category, search, condition, sort_by, sort_order,
 *               min_value, max_value, max_borrow_days, deposit_required, pickup_required,
 *               latitude, longitude, radius
 */
router.get("/", 
  ValidationMiddleware.validateResourceQuery(), 
  resourceController.getResources.bind(resourceController)
);

/**
 * GET /resources/search
 * Search resources with text query
 * Query params: q (required), page, limit, category, condition, sort_by, sort_order,
 *               min_value, max_value, latitude, longitude, radius
 */
router.get("/search", 
  ValidationMiddleware.validateSearch(),
  ValidationMiddleware.validateResourceQuery(),
  resourceController.searchResources.bind(resourceController)
);

/**
 * GET /resources/categories
 * Get all resource categories
 */
router.get("/categories", (req, res) => {
  res.json({
    success: true,
    data: {
      categories: RESOURCE_CATEGORIES,
      conditions: RESOURCE_CONDITIONS
    }
  });
});

/**
 * GET /resources/nearby
 * Get resources near a specific location
 * Query params: latitude (required), longitude (required), radius, page, limit, category, search
 */
router.get("/nearby", 
  ValidationMiddleware.validateLocation(),
  ValidationMiddleware.validateResourceQuery(),
  resourceController.getNearbyResources.bind(resourceController)
);

/**
 * GET /resources/user/:userId
 * Get all resources owned by a specific user
 * Query params: page, limit
 */
router.get("/user/:userId", 
  ValidationMiddleware.validateResourceQuery(),
  resourceController.getUserResources.bind(resourceController)
);

// Protected routes (authentication required)
// Note: These routes will require authentication middleware to be added later

/**
 * POST /resources
 * Create a new resource (authenticated users only)
 * Body: CreateResourceRequest or multipart/form-data
 */
router.post("/", 
  upload.array('photos', 10),
  authenticateToken,
  resourceController.createResource.bind(resourceController)
);

/**
 * GET /my-resources
 * Get all resources owned by the authenticated user
 * Query params: page, limit
 */
router.get("/my-resources", 
  authenticateToken,
  ValidationMiddleware.validateResourceQuery(),
  resourceController.getMyResources.bind(resourceController)
);

/**
 * GET /resources/:id
 * Get a single resource by ID
 */
router.get("/:id", 
  ValidationMiddleware.validateResourceId(),
  resourceController.getResourceById.bind(resourceController)
);

/**
 * PUT /resources/:id
 * Update a resource (resource owner only)
 * Body: UpdateResourceRequest
 */
router.put("/:id", 
  authenticateToken,
  ValidationMiddleware.validateResourceId(),
  ValidationMiddleware.validateUpdateResource(),
  resourceController.updateResource.bind(resourceController)
);

/**
 * DELETE /resources/:id
 * Delete a resource (resource owner only)
 */
router.delete("/:id", 
  authenticateToken,
  ValidationMiddleware.validateResourceId(),
  resourceController.deleteResource.bind(resourceController)
);

/**
 * POST /resources/:id/view
 * Record a view for a resource (for analytics)
 */
router.post("/:id/view", 
  ValidationMiddleware.validateResourceId(),
  resourceController.recordView.bind(resourceController)
);

/**
 * POST /resources/:id/availability
 * Toggle resource availability (resource owner only)
 * Body: { is_available: boolean }
 */
router.post("/:id/availability", 
  authenticateToken,
  ValidationMiddleware.validateResourceId(),
  ValidationMiddleware.validateAvailabilityToggle(),
  resourceController.toggleAvailability.bind(resourceController)
);

// Photo management routes

/**
 * POST /resources/:id/photos
 * Upload photos for a resource (resource owner only)
 * Body: multipart/form-data with photo files
 */
router.post("/:id/photos", 
  upload.array('photos', 10),
  authenticateToken,
  ValidationMiddleware.validateResourceId(),
  ValidationMiddleware.validatePhotoUpload(),
  resourceController.uploadPhotos.bind(resourceController)
);

/**
 * DELETE /resources/:resourceId/photos/:photoId
 * Delete a photo from a resource (resource owner only)
 */
router.delete("/:resourceId/photos/:photoId", 
  authenticateToken,
  ValidationMiddleware.validateResourceId(),
  resourceController.deletePhoto.bind(resourceController)
);

/**
 * PUT /resources/:id/photos/:photoId/primary
 * Set a photo as the primary photo for a resource (resource owner only)
 */
router.put("/:id/photos/:photoId/primary", 
  authenticateToken,
  ValidationMiddleware.validateResourceId(),
  resourceController.setPrimaryPhoto.bind(resourceController)
);

/**
 * PUT /resources/:id/photos/reorder
 * Reorder photos for a resource (resource owner only)
 * Body: { photoOrder: [{ id: number, order: number }] }
 */
router.put("/:id/photos/reorder", 
  authenticateToken,
  ValidationMiddleware.validateResourceId(),
  ValidationMiddleware.validatePhotoReorder(),
  resourceController.reorderPhotos.bind(resourceController)
);

export default router;
