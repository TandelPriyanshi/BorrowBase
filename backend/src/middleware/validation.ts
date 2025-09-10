import { Request, Response, NextFunction } from "express";
import { 
  ValidationError,
  validateRequired,
  validateLength,
  validateNumber,
  validateEnum,
  validateBoolean,
  validateArray
} from "../utils/errors";
import {
  RESOURCE_CATEGORIES,
  RESOURCE_CONDITIONS,
  RESOURCE_STATUSES,
  RESOURCE_VALIDATION
} from "../types/resource";

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array';
  min?: number;
  max?: number;
  enum?: readonly string[];
  custom?: (value: any) => boolean;
  message?: string;
}

export class ValidationMiddleware {
  /**
   * Generic validation middleware factory
   */
  static validate(rules: ValidationRule[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = { ...req.body, ...req.query, ...req.params };
        
        for (const rule of rules) {
          const value = data[rule.field];
          
          // Check required fields
          if (rule.required && (value === undefined || value === null || value === '')) {
            throw new ValidationError(`${rule.field} is required`);
          }
          
          // Skip validation if field is not present and not required
          if (value === undefined || value === null) {
            continue;
          }
          
          // Type validation
          if (rule.type) {
            switch (rule.type) {
              case 'string':
                if (typeof value !== 'string') {
                  throw new ValidationError(`${rule.field} must be a string`);
                }
                break;
              case 'number':
                const numValue = parseFloat(value);
                if (isNaN(numValue)) {
                  throw new ValidationError(`${rule.field} must be a valid number`);
                }
                break;
              case 'boolean':
                if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
                  throw new ValidationError(`${rule.field} must be a boolean`);
                }
                break;
              case 'array':
                if (!Array.isArray(value)) {
                  throw new ValidationError(`${rule.field} must be an array`);
                }
                break;
            }
          }
          
          // Length validation for strings
          if (typeof value === 'string' && (rule.min !== undefined || rule.max !== undefined)) {
            if (rule.min !== undefined && value.length < rule.min) {
              throw new ValidationError(`${rule.field} must be at least ${rule.min} characters long`);
            }
            if (rule.max !== undefined && value.length > rule.max) {
              throw new ValidationError(`${rule.field} must be no more than ${rule.max} characters long`);
            }
          }
          
          // Numeric range validation
          if (rule.type === 'number' && (rule.min !== undefined || rule.max !== undefined)) {
            const numValue = parseFloat(value);
            if (rule.min !== undefined && numValue < rule.min) {
              throw new ValidationError(`${rule.field} must be at least ${rule.min}`);
            }
            if (rule.max !== undefined && numValue > rule.max) {
              throw new ValidationError(`${rule.field} must be no more than ${rule.max}`);
            }
          }
          
          // Enum validation
          if (rule.enum && !rule.enum.includes(value)) {
            throw new ValidationError(`${rule.field} must be one of: ${rule.enum.join(', ')}`);
          }
          
          // Custom validation
          if (rule.custom && !rule.custom(value)) {
            throw new ValidationError(rule.message || `${rule.field} failed custom validation`);
          }
        }
        
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Validation for resource creation
   */
  static validateCreateResource() {
    return ValidationMiddleware.validate([
      {
        field: 'title',
        required: true,
        type: 'string',
        min: RESOURCE_VALIDATION.title.min,
        max: RESOURCE_VALIDATION.title.max
      },
      {
        field: 'description',
        required: true,
        type: 'string',
        min: RESOURCE_VALIDATION.description.min,
        max: RESOURCE_VALIDATION.description.max
      },
      {
        field: 'category',
        required: true,
        type: 'string',
        enum: RESOURCE_CATEGORIES
      },
      {
        field: 'condition',
        type: 'string',
        enum: RESOURCE_CONDITIONS
      },
      {
        field: 'estimated_value',
        type: 'number',
        min: RESOURCE_VALIDATION.estimated_value.min,
        max: RESOURCE_VALIDATION.estimated_value.max
      },
      {
        field: 'max_borrow_days',
        type: 'number',
        min: RESOURCE_VALIDATION.max_borrow_days.min,
        max: RESOURCE_VALIDATION.max_borrow_days.max
      },
      {
        field: 'deposit_required',
        type: 'number',
        min: RESOURCE_VALIDATION.deposit_required.min,
        max: RESOURCE_VALIDATION.deposit_required.max
      },
      {
        field: 'pickup_required',
        type: 'boolean'
      },
      {
        field: 'available_days',
        type: 'array',
        custom: (value) => {
          if (!Array.isArray(value)) return true; // Let type validation handle this
          return value.length >= 1 && value.length <= 7 && 
                 value.every(day => typeof day === 'string');
        },
        message: 'available_days must be an array of 1-7 day names'
      }
    ]);
  }

  /**
   * Validation for resource updates
   */
  static validateUpdateResource() {
    return ValidationMiddleware.validate([
      {
        field: 'title',
        type: 'string',
        min: RESOURCE_VALIDATION.title.min,
        max: RESOURCE_VALIDATION.title.max
      },
      {
        field: 'description',
        type: 'string',
        min: RESOURCE_VALIDATION.description.min,
        max: RESOURCE_VALIDATION.description.max
      },
      {
        field: 'category',
        type: 'string',
        enum: RESOURCE_CATEGORIES
      },
      {
        field: 'condition',
        type: 'string',
        enum: RESOURCE_CONDITIONS
      },
      {
        field: 'status',
        type: 'string',
        enum: RESOURCE_STATUSES
      },
      {
        field: 'estimated_value',
        type: 'number',
        min: RESOURCE_VALIDATION.estimated_value.min,
        max: RESOURCE_VALIDATION.estimated_value.max
      },
      {
        field: 'is_available',
        type: 'boolean'
      }
    ]);
  }

  /**
   * Validation for resource query filters
   */
  static validateResourceQuery() {
    return ValidationMiddleware.validate([
      {
        field: 'page',
        type: 'number',
        min: 1,
        max: 1000
      },
      {
        field: 'limit',
        type: 'number',
        min: 1,
        max: 100
      },
      {
        field: 'category',
        type: 'string',
        enum: RESOURCE_CATEGORIES
      },
      {
        field: 'condition',
        type: 'string',
        enum: RESOURCE_CONDITIONS
      },
      {
        field: 'sort_by',
        type: 'string',
        enum: ['created_at', 'title', 'estimated_value', 'views_count', 'average_rating'] as const
      },
      {
        field: 'sort_order',
        type: 'string',
        enum: ['ASC', 'DESC'] as const
      },
      {
        field: 'min_value',
        type: 'number',
        min: 0
      },
      {
        field: 'max_value',
        type: 'number',
        min: 0
      },
      {
        field: 'latitude',
        type: 'number',
        min: -90,
        max: 90
      },
      {
        field: 'longitude',
        type: 'number',
        min: -180,
        max: 180
      },
      {
        field: 'radius',
        type: 'number',
        min: 0.1,
        max: 1000
      }
    ]);
  }

  /**
   * Validation for search queries
   */
  static validateSearch() {
    return ValidationMiddleware.validate([
      {
        field: 'q',
        required: true,
        type: 'string',
        min: 2,
        max: 100,
        message: 'Search query must be 2-100 characters long'
      }
    ]);
  }

  /**
   * Validation for resource ID parameter
   */
  static validateResourceId() {
    return ValidationMiddleware.validate([
      {
        field: 'id',
        required: true,
        type: 'number',
        min: 1,
        message: 'Resource ID must be a positive integer'
      }
    ]);
  }

  /**
   * Validation for photo upload
   */
  static validatePhotoUpload() {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const files = req.files as Express.Multer.File[];
        
        if (!files || files.length === 0) {
          throw new ValidationError('At least one photo file is required');
        }
        
        if (files.length > 10) {
          throw new ValidationError('Maximum 10 photos allowed per upload');
        }
        
        // Validate each file
        for (const file of files) {
          // File size validation (10MB max)
          if (file.size > 10 * 1024 * 1024) {
            throw new ValidationError(`File ${file.originalname} exceeds 10MB size limit`);
          }
          
          // File type validation
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
          if (!allowedTypes.includes(file.mimetype)) {
            throw new ValidationError(`File ${file.originalname} has unsupported format. Only JPEG, PNG, and WebP are allowed`);
          }
        }
        
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Validation for photo reordering
   */
  static validatePhotoReorder() {
    return ValidationMiddleware.validate([
      {
        field: 'photoOrder',
        required: true,
        type: 'array',
        custom: (value) => {
          if (!Array.isArray(value)) return false;
          return value.every(item => 
            typeof item === 'object' && 
            typeof item.id === 'number' && 
            typeof item.order === 'number' &&
            item.id > 0 && item.order > 0
          );
        },
        message: 'photoOrder must be an array of objects with id and order properties'
      }
    ]);
  }

  /**
   * Validation for availability toggle
   */
  static validateAvailabilityToggle() {
    return ValidationMiddleware.validate([
      {
        field: 'is_available',
        required: true,
        type: 'boolean'
      }
    ]);
  }

  /**
   * Validation for location coordinates
   */
  static validateLocation() {
    return ValidationMiddleware.validate([
      {
        field: 'latitude',
        required: true,
        type: 'number',
        min: -90,
        max: 90
      },
      {
        field: 'longitude',
        required: true,
        type: 'number',
        min: -180,
        max: 180
      },
      {
        field: 'radius',
        type: 'number',
        min: 0.1,
        max: 1000
      }
    ]);
  }
}

/**
 * Sanitization middleware
 */
export class SanitizationMiddleware {
  /**
   * Sanitize string inputs to prevent XSS
   */
  static sanitizeStrings() {
    return (req: Request, res: Response, next: NextFunction) => {
      const sanitizeValue = (value: any): any => {
        if (typeof value === 'string') {
          // Basic XSS protection - remove potentially dangerous characters
          return value
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<[^>]*>/g, '')
            .trim();
        }
        if (typeof value === 'object' && value !== null) {
          const sanitized: any = Array.isArray(value) ? [] : {};
          for (const key in value) {
            sanitized[key] = sanitizeValue(value[key]);
          }
          return sanitized;
        }
        return value;
      };

      if (req.body) {
        req.body = sanitizeValue(req.body);
      }
      // Note: req.query is read-only in Express, so we skip sanitizing it
      // Query parameters are already parsed and typically safe from XSS in URL context

      next();
    };
  }
}
