import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface ProfileData {
  id: number;
  name: string;
  email: string;
  latitude?: number;
  longitude?: number;
  profile_pic_url?: string;
  verified: boolean;
  rating: number;
  counts: {
    borrowCount: number;
    lendCount: number;
    exchangeCount: number;
  };
  borrowRequestCounts: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
  lendItems: Array<{
    id: number;
    title: string;
    description: string;
  }>;
}

const ProfileSummary: React.FC = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/profile/');

      setProfileData(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      if (err.response?.status === 401) {
        // Redirect to login page
        window.location.href = '/login';
      } else {
        setError(err.response?.data?.error || 'Failed to fetch profile');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">{error || 'No profile data found'}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            {profileData.profile_pic_url ? (
              <img
                src={`http://localhost:5173${profileData.profile_pic_url.startsWith('/') ? profileData.profile_pic_url : `/${profileData.profile_pic_url}`}`}
                alt={profileData.name}
                className="w-16 h-16 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/default-avatar.png';
                }}
              />
            ) : (
              <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-xl font-semibold text-gray-600">
                  {profileData.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900">{profileData.name}</h1>
              {profileData.verified && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  ✓ Verified
                </span>
              )}
            </div>
            <p className="text-gray-600">{profileData.email}</p>
            <div className="flex items-center space-x-1 mt-1">
              <span className="text-yellow-400">⭐</span>
              <span className="text-sm font-medium">{profileData.rating}/5.00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Resource Counts */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">My Resources</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Items to Lend:</span>
              <span className="font-medium">{profileData.counts.lendCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Items to Borrow:</span>
              <span className="font-medium">{profileData.counts.borrowCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Items to Exchange:</span>
              <span className="font-medium">{profileData.counts.exchangeCount}</span>
            </div>
          </div>
        </div>

        {/* Borrow Requests Stats */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Requests Sent</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-yellow-600">Pending:</span>
              <span className="font-medium text-yellow-600">{profileData.borrowRequestCounts.pending}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-600">Approved:</span>
              <span className="font-medium text-green-600">{profileData.borrowRequestCounts.approved}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-600">Rejected:</span>
              <span className="font-medium text-red-600">{profileData.borrowRequestCounts.rejected}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between font-semibold">
              <span className="text-gray-900">Total:</span>
              <span className="text-gray-900">{profileData.borrowRequestCounts.total}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded">
              View All Requests
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded">
              Browse Items
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded">
              Add New Item
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded">
              Edit Profile
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h3>
          <div className="space-y-2 text-sm">
            {profileData.borrowRequestCounts.pending > 0 && (
              <div className="text-yellow-600">
                {profileData.borrowRequestCounts.pending} pending request{profileData.borrowRequestCounts.pending > 1 ? 's' : ''}
              </div>
            )}
            {profileData.borrowRequestCounts.approved > 0 && (
              <div className="text-green-600">
                {profileData.borrowRequestCounts.approved} approved request{profileData.borrowRequestCounts.approved > 1 ? 's' : ''}
              </div>
            )}
            {profileData.counts.lendCount > 0 && (
              <div className="text-blue-600">
                {profileData.counts.lendCount} item{profileData.counts.lendCount > 1 ? 's' : ''} available to lend
              </div>
            )}
            {profileData.borrowRequestCounts.total === 0 && profileData.counts.lendCount === 0 && (
              <div className="text-gray-500">
                No recent activity
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Lending Items */}
      {profileData.lendItems && profileData.lendItems.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Items You're Lending</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profileData.lendItems.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">{item.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                <button className="mt-2 text-sm text-blue-600 hover:text-blue-800">
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSummary;
