// Custom error classes for better error handling
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public field?: string;
  public value?: any;

  constructor(message: string, field?: string, value?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
    this.value = value;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Not authorized to perform this action') {
    super(message, 403, 'UNAUTHORIZED');
  }
}

export class ChatNotFoundError extends AppError {
  constructor(message: string = 'Chat not found or access denied') {
    super(message, 404, 'CHAT_NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

// Error response formatter
export interface ErrorResponse {
  message: string;
  success: false;
  error?: {
    code?: string;
    field?: string;
    value?: any;
    stack?: string;
  };
}

export const formatErrorResponse = (error: Error | AppError, includeStack: boolean = false): ErrorResponse => {
  const response: ErrorResponse = {
    message: error.message,
    success: false
  };

  if (error instanceof AppError) {
    response.error = {
      code: error.code
    };

    if (error instanceof ValidationError) {
      response.error.field = error.field;
      response.error.value = error.value;
    }
  }

  // Include stack trace in development
  if (includeStack && process.env.NODE_ENV === 'development') {
    response.error = {
      ...response.error,
      stack: error.stack
    };
  }

  return response;
};

// Validation helper functions
export const validateRequired = (value: any, fieldName: string): void => {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`, fieldName, value);
  }
};

export const validateLength = (
  value: string, 
  fieldName: string, 
  min?: number, 
  max?: number
): void => {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`, fieldName, value);
  }

  if (min !== undefined && value.length < min) {
    throw new ValidationError(
      `${fieldName} must be at least ${min} characters long`,
      fieldName,
      value
    );
  }

  if (max !== undefined && value.length > max) {
    throw new ValidationError(
      `${fieldName} must be no more than ${max} characters long`,
      fieldName,
      value
    );
  }
};

export const validateNumber = (
  value: any,
  fieldName: string,
  min?: number,
  max?: number,
  required: boolean = false
): void => {
  if (value === undefined || value === null) {
    if (required) {
      throw new ValidationError(`${fieldName} is required`, fieldName, value);
    }
    return;
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    throw new ValidationError(`${fieldName} must be a valid number`, fieldName, value);
  }

  if (min !== undefined && num < min) {
    throw new ValidationError(
      `${fieldName} must be at least ${min}`,
      fieldName,
      value
    );
  }

  if (max !== undefined && num > max) {
    throw new ValidationError(
      `${fieldName} must be no more than ${max}`,
      fieldName,
      value
    );
  }
};

export const validateInteger = (
  value: any,
  fieldName: string,
  min?: number,
  max?: number,
  required: boolean = false
): void => {
  validateNumber(value, fieldName, min, max, required);
  
  if (value !== undefined && value !== null) {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (!Number.isInteger(num)) {
      throw new ValidationError(`${fieldName} must be an integer`, fieldName, value);
    }
  }
};

export const validateEnum = (
  value: any,
  fieldName: string,
  allowedValues: readonly string[] | string[],
  required: boolean = false
): void => {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new ValidationError(`${fieldName} is required`, fieldName, value);
    }
    return;
  }

  if (!allowedValues.includes(value)) {
    throw new ValidationError(
      `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      fieldName,
      value
    );
  }
};

export const validateBoolean = (
  value: any,
  fieldName: string,
  required: boolean = false
): void => {
  if (value === undefined || value === null) {
    if (required) {
      throw new ValidationError(`${fieldName} is required`, fieldName, value);
    }
    return;
  }

  if (typeof value !== 'boolean') {
    // Try to parse string boolean values
    if (value === 'true' || value === 'false') {
      return;
    }
    throw new ValidationError(`${fieldName} must be a boolean value`, fieldName, value);
  }
};

export const validateArray = (
  value: any,
  fieldName: string,
  minLength?: number,
  maxLength?: number,
  required: boolean = false
): void => {
  if (value === undefined || value === null) {
    if (required) {
      throw new ValidationError(`${fieldName} is required`, fieldName, value);
    }
    return;
  }

  if (!Array.isArray(value)) {
    throw new ValidationError(`${fieldName} must be an array`, fieldName, value);
  }

  if (minLength !== undefined && value.length < minLength) {
    throw new ValidationError(
      `${fieldName} must contain at least ${minLength} items`,
      fieldName,
      value
    );
  }

  if (maxLength !== undefined && value.length > maxLength) {
    throw new ValidationError(
      `${fieldName} must contain no more than ${maxLength} items`,
      fieldName,
      value
    );
  }
};

// Location validation
export const validateCoordinates = (
  latitude: any,
  longitude: any,
  required: boolean = false
): void => {
  if ((latitude === undefined || latitude === null) && 
      (longitude === undefined || longitude === null)) {
    if (required) {
      throw new ValidationError('Location coordinates are required');
    }
    return;
  }

  if ((latitude === undefined || latitude === null) || 
      (longitude === undefined || longitude === null)) {
    throw new ValidationError('Both latitude and longitude must be provided');
  }

  validateNumber(latitude, 'latitude', -90, 90, true);
  validateNumber(longitude, 'longitude', -180, 180, true);
};

// Pagination validation
export const validatePagination = (page?: any, limit?: any) => {
  if (page !== undefined) {
    validateInteger(page, 'page', 1, 1000);
  }
  
  if (limit !== undefined) {
    validateInteger(limit, 'limit', 1, 100);
  }
};

// ID validation
export const validateId = (id: any, fieldName: string = 'id'): number => {
  if (id === undefined || id === null) {
    throw new ValidationError(`${fieldName} is required`, fieldName, id);
  }

  const numId = typeof id === 'string' ? parseInt(id) : id;
  
  if (isNaN(numId) || !Number.isInteger(numId) || numId <= 0) {
    throw new ValidationError(`${fieldName} must be a positive integer`, fieldName, id);
  }

  return numId;
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Controller error handler
export const handleControllerError = (error: Error | AppError, res: any) => {
  let statusCode = 500;
  
  if (error instanceof AppError) {
    statusCode = error.statusCode;
  }

  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorResponse = formatErrorResponse(error, isDevelopment);

  // Log error in development
  if (isDevelopment) {
    console.error('Controller Error:', error);
  }

  res.status(statusCode).json(errorResponse);
};

// Global error handler middleware
export const globalErrorHandler = (
  error: Error | AppError,
  req: any,
  res: any,
  next: any
) => {
  let statusCode = 500;
  
  if (error instanceof AppError) {
    statusCode = error.statusCode;
  }

  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorResponse = formatErrorResponse(error, isDevelopment);

  // Log error in development
  if (isDevelopment) {
    console.error('Error:', error);
  }

  res.status(statusCode).json(errorResponse);
};
