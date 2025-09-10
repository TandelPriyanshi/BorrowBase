import React, { useState } from 'react';
import { submitReview } from '../services/reviewService';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface RatingReviewProps {
  userId: string;
  userName: string;
  onClose: () => void;
  onReviewSubmitted?: () => void;
}

const RatingReview: React.FC<RatingReviewProps> = ({ userId, userName, onClose, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const quickTags = [
    'Reliable',
    'Friendly',
    'Item as Described',
    'Quick Response',
    'Punctual',
    'Easy to Work With',
  ];

  const handleStarClick = (star: number) => {
    setRating(star);
    setError('');
  };

  const handleTagClick = (tag: string) => {
    setSelectedTags((prevTags) =>
      prevTags.includes(tag) ? prevTags.filter((t) => t !== tag) : [...prevTags, tag]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const message = `${review}${selectedTags.length > 0 ? `\n\nTags: ${selectedTags.join(', ')}` : ''}`;
      
      await submitReview({
        userId,
        rating,
        message,
      });

      toast.success('Thank you for your review!', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Call the onReviewSubmitted callback if provided
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
      
      // Close the modal after a short delay to show the success message
      setTimeout(() => {
        onClose();
      }, 100);
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingLabels: { [key: number]: string } = {
    1: 'Very Poor - Not as expected, big issues.',
    2: 'Poor - Needs improvement, had difficulties.',
    3: 'Okay - Average experience, nothing special.',
    4: 'Good - Worked well, I’d recommend.',
    5: 'Excellent - Amazing experience, highly reliable!',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[1000]">
      <div className="bg-white p-8 rounded-lg w-[90%] max-w-md text-center relative shadow-lg">
        <button
          className={`absolute top-2 right-3 text-2xl font-bold text-gray-500 hover:text-gray-700 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Close"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold mb-2">Share your experience!</h2>
        <p className="text-gray-600 mb-4">
          How was your borrowing experience with <strong>{userName}</strong>?<br />
          Your feedback helps build trust and makes BorrowBase safer for everyone.
        </p>

        {/* Star Rating */}
        <div className="flex justify-center gap-2 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`text-3xl cursor-pointer transition-colors ${
                star <= rating ? 'text-yellow-400' : 'text-gray-300'
              }`}
              onClick={() => handleStarClick(star)}
            >
              ⭐
            </span>
          ))}
        </div>
        {rating > 0 && <p className="text-sm text-gray-500 mb-4">{ratingLabels[rating]}</p>}

        {/* Review Box */}
        <textarea
          className="w-full h-24 p-2 border border-gray-300 rounded-md mb-4 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Write a short review (e.g., communication, item quality, punctuality)"
          value={review}
          onChange={(e) => setReview(e.target.value)}
        />

        {/* Quick Tags */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {quickTags.map((tag) => (
            <button
              key={tag}
              className={`px-3 py-1 rounded-full border text-sm transition ${
                selectedTags.includes(tag)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => handleTagClick(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <div className="flex justify-center gap-3 mt-6">
          <button
            className={`px-6 py-2 rounded-md font-semibold text-white transition ${
              rating === 0 || isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
          <button
            className={`px-6 py-2 rounded-md font-semibold text-white transition ${
              isSubmitting ? 'bg-gray-400' : 'bg-gray-600 hover:bg-gray-700'
            }`}
            onClick={onClose}
            disabled={isSubmitting}
          >
            Skip for Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingReview;
