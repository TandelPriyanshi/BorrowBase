import { Resource } from "../entities/Resource";
import { ResourcePhoto } from "../entities/ResourcePhoto";
import { User } from "../entities/User";

// Resource creation request
export interface CreateResourceRequest {
  title: string;
  description: string;
  category: string;
  estimated_value?: number;
  condition?: string;
  condition_notes?: string;
  max_borrow_days?: number;
  deposit_required?: number;
  pickup_required?: boolean;
  pickup_instructions?: string;
  usage_instructions?: string;
  location_notes?: string;
  available_days?: string[];
  available_time_start?: string;
  available_time_end?: string;
}

// Resource update request
export interface UpdateResourceRequest {
  title?: string;
  description?: string;
  category?: string;
  estimated_value?: number;
  condition?: string;
  condition_notes?: string;
  max_borrow_days?: number;
  deposit_required?: number;
  pickup_required?: boolean;
  pickup_instructions?: string;
  usage_instructions?: string;
  location_notes?: string;
  available_days?: string[];
  available_time_start?: string;
  available_time_end?: string;
  is_available?: boolean;
  status?: string; // active, borrowed, maintenance, inactive
}

// Resource query filters
export interface ResourceQueryFilters {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  condition?: string;
  status?: string;
  is_available?: boolean;
  min_value?: number;
  max_value?: number;
  max_borrow_days?: number;
  deposit_required?: boolean;
  pickup_required?: boolean;
  // Location-based filters
  latitude?: number;
  longitude?: number;
  radius?: number; // in km
  // Date filters
  available_from?: string;
  available_to?: string;
  // Sorting
  sort_by?: 'created_at' | 'title' | 'estimated_value' | 'views_count' | 'average_rating';
  sort_order?: 'ASC' | 'DESC';
}

// Resource with owner info (for public listings)
export interface ResourceWithOwner extends Omit<Resource, 'owner'> {
  owner: {
    id: number;
    name: string;
    average_rating: number;
    total_ratings: number;
    is_location_verified: boolean;
    neighborhood?: string;
  };
  photos?: ResourcePhoto[];
  distance?: number; // calculated distance from user's location
}

// Resource with full owner info (for resource details)
export interface ResourceWithFullOwner extends Omit<Resource, 'owner'> {
  owner: Omit<User, 'password' | 'refresh_token' | 'email'>;
  photos?: ResourcePhoto[];
  distance?: number;
  can_edit?: boolean; // whether current user can edit this resource
}

// Paginated resource response
export interface PaginatedResourceResponse {
  data: ResourceWithOwner[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters?: {
    category?: string;
    search?: string;
    location?: {
      latitude: number;
      longitude: number;
      radius: number;
    };
  };
  success: boolean;
}

// Single resource response
export interface SingleResourceResponse {
  data: ResourceWithFullOwner;
  success: boolean;
}

// Resource category enum (common categories)
export const RESOURCE_CATEGORIES = [
  'Tools',
  'Electronics',
  'Books',
  'Furniture',
  'Sports & Recreation',
  'Kitchen & Appliances',
  'Garden & Outdoor',
  'Musical Instruments',
  'Automotive',
  'Clothing & Accessories',
  'Baby & Kids',
  'Health & Beauty',
  'Art & Craft',
  'Office Supplies',
  'Travel & Luggage',
  'Other'
] as const;

export type ResourceCategory = typeof RESOURCE_CATEGORIES[number];

// Resource condition enum
export const RESOURCE_CONDITIONS = [
  'excellent',
  'good', 
  'fair',
  'poor'
] as const;

export type ResourceCondition = typeof RESOURCE_CONDITIONS[number];

// Resource status enum
export const RESOURCE_STATUSES = [
  'active',
  'borrowed',
  'maintenance',
  'inactive'
] as const;

export type ResourceStatus = typeof RESOURCE_STATUSES[number];

// Photo upload request
export interface ResourcePhotoRequest {
  resource_id: number;
  photo_url: string;
  photo_filename?: string;
  is_primary?: boolean;
  alt_text?: string;
  display_order?: number;
}

// Resource statistics
export interface ResourceStats {
  total_resources: number;
  available_resources: number;
  borrowed_resources: number;
  categories_count: { [key: string]: number };
  average_rating: number;
  total_views: number;
}

// Search suggestions
export interface ResourceSearchSuggestions {
  categories: string[];
  recent_searches: string[];
  popular_items: string[];
}

// Validation schemas
export interface ResourceValidationRules {
  title: {
    min: number;
    max: number;
    required: boolean;
  };
  description: {
    min: number;
    max: number;
    required: boolean;
  };
  category: {
    required: boolean;
    allowed_values: string[];
  };
  estimated_value: {
    min: number;
    max: number;
  };
  max_borrow_days: {
    min: number;
    max: number;
  };
  deposit_required: {
    min: number;
    max: number;
  };
}

// Default validation rules
export const RESOURCE_VALIDATION: ResourceValidationRules = {
  title: {
    min: 3,
    max: 200,
    required: true
  },
  description: {
    min: 10,
    max: 2000,
    required: true
  },
  category: {
    required: true,
    allowed_values: [...RESOURCE_CATEGORIES]
  },
  estimated_value: {
    min: 0,
    max: 1000000
  },
  max_borrow_days: {
    min: 1,
    max: 365
  },
  deposit_required: {
    min: 0,
    max: 10000
  }
};

// API Response types
export interface ResourceResponse<T = any> {
  data?: T;
  message: string;
  success: boolean;
}

// Generic API response format
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Location utility types
export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocationDistance extends LocationCoordinates {
  distance: number; // in kilometers
}
