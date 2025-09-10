import { Request, Response, NextFunction } from "express";
import { ValidationError, NotFoundError, UnauthorizedError, ConflictError } from "../utils/errors";

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: any;
  field?: string;
  code?: string;
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error("Error occurred:", error);

  // Default error response
  let statusCode = 500;
  let errorResponse: ErrorResponse = {
    success: false,
    error: "Internal Server Error",
    message: "Something went wrong on the server"
  };

  // Handle specific error types
  if (error instanceof ValidationError) {
    statusCode = 400;
    errorResponse = {
      success: false,
      error: "Validation Error",
      message: error.message,
      code: "VALIDATION_ERROR"
    };

    // Extract field name from validation error message if possible
    const fieldMatch = error.message.match(/^(\w+) /);
    if (fieldMatch) {
      errorResponse.field = fieldMatch[1];
    }
  } else if (error instanceof NotFoundError) {
    statusCode = 404;
    errorResponse = {
      success: false,
      error: "Not Found",
      message: error.message,
      code: "NOT_FOUND"
    };
  } else if (error instanceof UnauthorizedError) {
    statusCode = 401;
    errorResponse = {
      success: false,
      error: "Unauthorized",
      message: error.message,
      code: "UNAUTHORIZED"
    };
  } else if (error instanceof ConflictError) {
    statusCode = 409;
    errorResponse = {
      success: false,
      error: "Conflict",
      message: error.message,
      code: "CONFLICT"
    };
  } else if (error.name === "MulterError") {
    // Handle file upload errors
    statusCode = 400;
    errorResponse = {
      success: false,
      error: "File Upload Error",
      message: error.message,
      code: "FILE_ERROR"
    };
  } else if (error.message.includes("ENOENT")) {
    statusCode = 404;
    errorResponse = {
      success: false,
      error: "File Not Found",
      message: "The requested file was not found",
      code: "FILE_NOT_FOUND"
    };
  }

  // Send JSON response
  res.status(statusCode).json(errorResponse);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  const errorResponse: ErrorResponse = {
    success: false,
    error: "Not Found",
    message: `Route ${req.method} ${req.path} not found`,
    code: "ROUTE_NOT_FOUND"
  };

  res.status(404).json(errorResponse);
};
