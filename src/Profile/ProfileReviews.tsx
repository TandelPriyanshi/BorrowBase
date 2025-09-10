import { useState, useEffect } from 'react';
import { getUserReviews } from '../services/reviewService';
import { Star } from 'lucide-react';
import ApiService from '../services/apiService';

interface Review {
  id: number;
  stars: number;
  message: string;
  created_at: string;
  reviewer_name: string;
  profile_pic_url: string;
  reviewer_id: number;
  user_id: number;
}

interface ProfileReviewsProps {
  profileData: any;
}

const ProfileReviews = ({ profileData }: ProfileReviewsProps) => {
  const [activeReviewTab, setActiveReviewTab] = useState<'received' | 'given'>('received');

  if (!profileData) {
    return <div className="text-center py-8">Loading reviews...</div>;
  }

  const receivedReviews = profileData.reviews?.received || [];
  const givenReviews = profileData.reviews?.given || [];
  const currentReviews = activeReviewTab === 'received' ? receivedReviews : givenReviews;

  const renderStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <Star
          key={i}
          size={16}
          className={`inline ${
            i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
          aria-hidden="true"
        />
      ));
  };

  return (
    <div className="py-4 px-4">
      {/* Tab selector */}
      <div className="flex mb-6 border-b">
        <button
          className={`px-4 py-2 font-medium ${
            activeReviewTab === 'received'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setActiveReviewTab('received')}
        >
          Reviews Received ({receivedReviews.length})
        </button>
        <button
          className={`px-4 py-2 font-medium ml-4 ${
            activeReviewTab === 'given'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setActiveReviewTab('given')}
        >
          Reviews Given ({givenReviews.length})
        </button>
      </div>

      {/* Reviews list */}
      {currentReviews.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-lg mb-2">
            {activeReviewTab === 'received' 
              ? 'No reviews received yet' 
              : 'No reviews given yet'
            }
          </div>
          <div className="text-sm">
            {activeReviewTab === 'received'
              ? 'Reviews from other users will appear here'
              : 'Reviews you\'ve left for others will appear here'
            }
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {currentReviews.map((review: any) => {
            const reviewerName = activeReviewTab === 'received' 
              ? review.reviewer?.name || 'Anonymous User'
              : review.reviewee?.name || 'Anonymous User';
            const avatarUrl = activeReviewTab === 'received'
              ? review.reviewer?.avatar_url
              : review.reviewee?.avatar_url;
            
            return (
              <div key={review.id} className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {avatarUrl ? (
                      <img
                        src={`http://localhost:5173/${avatarUrl}`}
                        alt={reviewerName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                        {reviewerName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{reviewerName}</h4>
                        <div className="flex items-center mt-1">
                          {renderStars(review.rating)}
                          <span className="ml-2 text-sm text-gray-600">
                            {review.rating}/5
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="mt-3 text-gray-700">{review.comment}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProfileReviews;
