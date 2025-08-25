import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaStar, FaStarHalfAlt, FaRegStar, FaTimes } from 'react-icons/fa';

interface Review {
  id: number;
  rating: number;
  message: string;
  created_at: string;
  reviewer_name: string;
}

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId: number;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, resourceId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      // Use the correct endpoint for fetching reviews by user ID
      const response = await axios.get(`http://localhost:3000/api/reviews/${resourceId}`, {
        withCredentials: true
      });
      setReviews(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReviews();
    }
  }, [isOpen, resourceId]);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="text-yellow-400 inline" />);
    }

    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-yellow-400 inline" />);
    }

    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-yellow-400 inline" />);
    }

    return stars;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[1000] p-4">
      <div className="bg-gray-800 text-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-xl font-semibold">Reviews</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white focus:outline-none"
            aria-label="Close"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1 p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-400 text-center p-4">{error}</div>
          ) : reviews.length === 0 ? (
            <div className="text-gray-400 text-center p-4">No reviews yet. Be the first to review!</div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-700 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{review.reviewer_name}</h4>
                      <div className="flex items-center mt-1">
                        <div className="mr-2">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm text-gray-400">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {review.message && (
                    <p className="mt-2 text-gray-300">{review.message}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
