# Resource Module Implementation

This document describes the comprehensive Resource module implementation for the BorrowBase backend API.

## Overview

The Resource module provides complete CRUD operations for managing shared resources, including:
- Resource creation, retrieval, updating, and deletion
- Advanced filtering and search capabilities
- Location-based queries with distance calculations
- Photo upload and management
- Category management
- Pagination and sorting

## Module Structure

### 1. Types and Interfaces (`src/types/resource.ts`)

**Core Resource Types:**
- `CreateResourceRequest` - Resource creation payload
- `UpdateResourceRequest` - Resource update payload
- `ResourceQueryFilters` - Advanced filtering options
- `ResourceWithOwner` - Public resource view with minimal owner info
- `ResourceWithFullOwner` - Detailed resource view with full owner data
- `PaginatedResourceResponse` - Paginated resource results
- `ApiResponse<T>` - Generic API response wrapper

**Enums and Constants:**
- `RESOURCE_CATEGORIES` - Predefined resource categories
- `RESOURCE_CONDITIONS` - Item condition states
- `RESOURCE_STATUSES` - Resource availability statuses
- `RESOURCE_VALIDATION` - Validation rules and limits

### 2. Service Layer (`src/services/ResourceService.ts`)

**Core Operations:**
- `createResource()` - Create new resources with validation
- `getResources()` - Advanced resource querying with filtering
- `getResourceById()` - Fetch single resource with view tracking
- `updateResource()` - Update with ownership validation
- `deleteResource()` - Soft delete with dependency checks
- `getUserResources()` - Get user's owned resources

**Advanced Features:**
- `searchResources()` - Full-text search across title/description
- `getResourceCategories()` - Category statistics
- Location-based filtering with Haversine distance calculation
- Comprehensive input validation and sanitization
- Automatic view counting and statistics tracking

### 3. Photo Management (`src/services/PhotoService.ts`)

**Photo Operations:**
- `uploadPhotos()` - Multi-file upload with validation
- `deletePhoto()` - Remove photos with file cleanup
- `setPrimaryPhoto()` - Designate primary display photo
- `reorderPhotos()` - Custom photo ordering
- `getResourcePhotos()` - Retrieve ordered photo list
- `cleanupOrphanedPhotos()` - Maintenance utility

**Features:**
- File type validation (JPEG, PNG, WebP)
- Size limits (10MB per file, 10 files per resource)
- Unique filename generation with UUID
- Disk storage management
- Database and filesystem sync

### 4. Controller Layer (`src/controllers/ResourceController.ts`)

**Public Endpoints:**
- `GET /resources` - List resources with filtering
- `GET /resources/search` - Text-based search
- `GET /resources/categories` - Category statistics
- `GET /resources/nearby` - Location-based search
- `GET /resources/:id` - Single resource details
- `GET /resources/user/:userId` - User's public resources

**Protected Endpoints:**
- `POST /resources` - Create new resource
- `PUT /resources/:id` - Update resource
- `DELETE /resources/:id` - Delete resource
- `GET /my-resources` - Current user's resources
- `POST /resources/:id/photos` - Upload photos
- `DELETE /resources/:resourceId/photos/:photoId` - Delete photo
- `PUT /resources/:id/photos/:photoId/primary` - Set primary photo
- `PUT /resources/:id/photos/reorder` - Reorder photos
- `POST /resources/:id/availability` - Toggle availability
- `POST /resources/:id/view` - Record view

**File Serving:**
- `GET /uploads/resources/:filename` - Serve uploaded photos

### 5. Error Handling (`src/utils/errors.ts`)

**Custom Error Types:**
- `ValidationError` - Input validation failures
- `NotFoundError` - Resource not found
- `UnauthorizedError` - Permission denied
- `AppError` - Base application error

**Validation Utilities:**
- Field presence validation
- String length validation
- Numeric range validation
- Enum value validation
- Boolean type validation
- Array validation
- Pagination validation

## API Endpoints

### Public Endpoints

#### Get Resources
```http
GET /api/resources
```

**Query Parameters:**
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 10, max: 50)
- `category` (string) - Filter by category
- `search` (string) - Text search in title/description
- `condition` (string) - Filter by condition (excellent, good, fair, poor)
- `sort_by` (string) - Sort field (created_at, title, estimated_value, views_count, average_rating)
- `sort_order` (string) - Sort direction (ASC, DESC)
- `min_value` (number) - Minimum estimated value
- `max_value` (number) - Maximum estimated value
- `max_borrow_days` (number) - Maximum borrow period
- `deposit_required` (boolean) - Filter by deposit requirement
- `pickup_required` (boolean) - Filter by pickup requirement
- `latitude` (number) - User latitude for distance calculation
- `longitude` (number) - User longitude for distance calculation
- `radius` (number) - Search radius in km (default: 10)

#### Search Resources
```http
GET /api/resources/search?q=search_term
```

#### Get Categories
```http
GET /api/resources/categories
```

#### Get Resource by ID
```http
GET /api/resources/:id
```

#### Get Nearby Resources
```http
GET /api/resources/nearby?latitude=lat&longitude=lng
```

### Protected Endpoints

#### Create Resource
```http
POST /api/resources
Content-Type: application/json

{
  "title": "Resource Title",
  "description": "Detailed description",
  "category": "Tools",
  "estimated_value": 100,
  "condition": "good",
  "max_borrow_days": 7,
  "deposit_required": 50,
  "pickup_required": true,
  "pickup_instructions": "Available weekdays 9-5",
  "usage_instructions": "Handle with care",
  "available_days": ["Monday", "Tuesday", "Wednesday"],
  "available_time_start": "09:00",
  "available_time_end": "17:00"
}
```

#### Update Resource
```http
PUT /api/resources/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "is_available": true
}
```

#### Upload Photos
```http
POST /api/resources/:id/photos
Content-Type: multipart/form-data

photos: [file1, file2, ...]
```

#### Delete Photo
```http
DELETE /api/resources/:resourceId/photos/:photoId
```

#### Set Primary Photo
```http
PUT /api/resources/:id/photos/:photoId/primary
```

#### Reorder Photos
```http
PUT /api/resources/:id/photos/reorder
Content-Type: application/json

{
  "photoOrder": [
    {"id": 1, "order": 1},
    {"id": 2, "order": 2}
  ]
}
```

## Features

### Advanced Filtering
- **Category Filtering**: Filter by predefined categories
- **Condition Filtering**: Filter by item condition
- **Value Range**: Filter by estimated value range
- **Availability Options**: Filter by deposit/pickup requirements
- **Time-based**: Filter by maximum borrow days
- **Combined Filtering**: Multiple filters can be applied simultaneously

### Location-Based Search
- **Distance Calculation**: Uses Haversine formula for accurate distance
- **Radius Filtering**: Configurable search radius
- **Nearby Resources**: Dedicated endpoint for location-based discovery
- **Distance Display**: Results include calculated distance from user

### Search Capabilities
- **Full-text Search**: Searches across title and description
- **Search with Filters**: Combine text search with other filters
- **Flexible Matching**: Case-insensitive partial matching

### Photo Management
- **Multi-file Upload**: Upload up to 10 photos per resource
- **File Validation**: Validates file type, size, and format
- **Primary Photo**: Designate main display photo
- **Custom Ordering**: Reorder photos for optimal display
- **Secure Storage**: Files stored with unique names
- **Cleanup Utilities**: Remove orphaned files

### Security & Validation
- **Ownership Checks**: Users can only modify their own resources
- **Input Validation**: Comprehensive validation of all inputs
- **File Security**: Validated file uploads with size/type limits
- **Authentication Required**: Protected endpoints require valid authentication
- **SQL Injection Protection**: Parameterized queries throughout

### Performance Optimizations
- **Pagination**: Efficient pagination for large result sets
- **Query Optimization**: Optimized database queries with proper joins
- **View Tracking**: Non-blocking view count updates
- **File Caching**: Static file serving with caching headers
- **Index Usage**: Database indexes on frequently queried fields

## Database Schema

The module works with the existing entity schema:
- `Resource` - Main resource entity
- `ResourcePhoto` - Photo storage and metadata
- `User` - Resource ownership and user data

## Error Handling

All endpoints provide consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "message": "User-friendly message"
}
```

Common error codes:
- `400` - Validation errors, bad requests
- `401` - Authentication required
- `403` - Unauthorized access (ownership issues)
- `404` - Resource not found
- `413` - File too large
- `422` - Validation failures
- `500` - Server errors

## Usage Examples

### Creating a Resource with Photos

1. Create the resource:
```bash
curl -X POST http://localhost:5000/api/resources \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title":"Drill","category":"Tools","description":"Power drill for rent"}'
```

2. Upload photos:
```bash
curl -X POST http://localhost:5000/api/resources/1/photos \
  -H "Authorization: Bearer <token>" \
  -F "photos=@photo1.jpg" \
  -F "photos=@photo2.jpg"
```

### Searching Resources

```bash
curl "http://localhost:5000/api/resources?search=drill&category=Tools&latitude=40.7128&longitude=-74.0060&radius=5"
```

### Getting Nearby Resources

```bash
curl "http://localhost:5000/api/resources/nearby?latitude=40.7128&longitude=-74.0060&radius=10&limit=20"
```

## Testing

The module includes comprehensive validation and error handling that can be tested using the provided endpoints. Key test scenarios:

1. **CRUD Operations**: Create, read, update, delete resources
2. **Permission Testing**: Ownership validation
3. **File Upload**: Photo upload with various file types/sizes
4. **Search & Filter**: All filtering combinations
5. **Location Queries**: Distance-based searches
6. **Validation**: Invalid input handling
7. **Edge Cases**: Large datasets, missing data, etc.

## Future Enhancements

Potential improvements:
- Image resizing and optimization
- Advanced search with Elasticsearch
- Resource recommendations
- Batch operations
- Export functionality
- Resource analytics
- Advanced photo management (cropping, filters)
- Video support
- Bulk photo upload
- Resource templates

This Resource module provides a complete, production-ready implementation with comprehensive features, security, and scalability considerations.
