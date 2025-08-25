import { useState, useEffect } from 'react';
import { getUserReviews } from '../services/reviewService';
import { Star } from 'lucide-react';

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

const ProfileReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        // Get the current user's ID from the profile
        const profileRes = await fetch('http://localhost:3000/api/profile', {
          credentials: 'include',
        });
        const profileData = await profileRes.json();
        
        if (profileData?.id) {
          const reviewsData = await getUserReviews(profileData.id.toString());
          setReviews(reviewsData);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError('Failed to load reviews. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const renderStars = (stars: number) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <Star
          key={i}
          size={16}
          className={`inline ${
            i < Math.floor(stars) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
          aria-hidden="true"
        />
      ));
  };

  if (loading) {
    return <div className="text-center py-8">Loading reviews...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No reviews yet. Your reviews will appear here.
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4 px-4">
      {reviews.map((review) => (
        <div key={review.id} className="border-b border-gray-200 pb-4 mb-4">
          <div className="flex items-center mb-2">
            {review.profile_pic_url ? (
              <img
                src={review.profile_pic_url}
                alt={review.reviewer_name}
                className="w-10 h-10 rounded-full mr-3"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 mr-3">
                {review.reviewer_name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <div className="font-medium">{review.reviewer_name || 'Unknown User'}</div>
              <div className="flex">{renderStars(review.stars)}</div>
            </div>
            <div className="ml-auto text-sm text-gray-500">
              {new Date(review.created_at).toLocaleDateString()}
            </div>
          </div>
          <p className="text-gray-700 mt-2">{review.message}</p>
        </div>
      ))}
    </div>
  );
};

export default ProfileReviews;
