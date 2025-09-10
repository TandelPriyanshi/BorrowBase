import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface BorrowRequest {
  id: number;
  resource_id: number;
  message: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  resource_title: string;
  resource_description: string;
  resource_category: string;
  resource_type: string;
  resource_available: boolean;
  owner_name: string;
  owner_email: string;
  owner_profile_pic: string;
  owner_rating: number;
  resource_photos: string[];
}

interface BorrowRequestsResponse {
  success: boolean;
  data: BorrowRequest[];
  total: number;
  status?: string;
}

const BorrowRequestsList: React.FC = () => {
  const [borrowRequests, setBorrowRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchBorrowRequests();
  }, [filter]);

  const fetchBorrowRequests = async () => {
    try {
      setLoading(true);
      const endpoint = filter === 'all' 
        ? '/api/profile/borrow-requests'
        : `/api/profile/borrow-requests/${filter}`;
      
      const response = await api.get<BorrowRequestsResponse>(endpoint);

      setBorrowRequests(response.data.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching borrow requests:', err);
      if (err.response?.status === 401) {
        // Redirect to login page
        window.location.href = '/login';
      } else {
        setError(err.response?.data?.message || 'Failed to fetch borrow requests');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">My Borrow Requests</h2>
        
        {/* Filter Buttons */}
        <div className="flex space-x-2">
          {['all', 'pending', 'approved', 'rejected', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 text-sm font-medium rounded-md ${
                filter === status
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      {borrowRequests.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500">
            {filter === 'all' 
              ? "You haven't sent any borrow requests yet."
              : `No ${filter} requests found.`
            }
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {borrowRequests.map((request) => (
            <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      {request.resource_title}
                    </h3>
                    {getStatusBadge(request.status)}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{request.resource_description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Category: {request.resource_category}</span>
                    <span>Type: {request.resource_type}</span>
                    <span>Owner: {request.owner_name}</span>
                    <span>Rating: ⭐ {request.owner_rating}/5</span>
                  </div>
                </div>

                {/* Resource Photos */}
                {request.resource_photos.length > 0 && (
                  <div className="flex space-x-2 ml-4">
                    {request.resource_photos.slice(0, 3).map((photo, index) => (
                      <img
                        key={index}
                        src={`http://localhost:3000/${photo}`}
                        alt={`${request.resource_title} ${index + 1}`}
                        className="w-16 h-16 object-cover rounded-md"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-image.jpg';
                        }}
                      />
                    ))}
                    {request.resource_photos.length > 3 && (
                      <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center text-sm text-gray-500">
                        +{request.resource_photos.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Request Message */}
              {request.message && (
                <div className="bg-gray-50 rounded-md p-3 mb-4">
                  <p className="text-sm text-gray-700">
                    <strong>Your message:</strong> "{request.message}"
                  </p>
                </div>
              )}

              {/* Dates */}
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Requested: {formatDate(request.created_at)}</span>
                {request.updated_at !== request.created_at && (
                  <span>Updated: {formatDate(request.updated_at)}</span>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 flex space-x-3">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View Resource
                </button>
                <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                  Contact Owner
                </button>
                {request.status === 'pending' && (
                  <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                    Cancel Request
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BorrowRequestsList;
