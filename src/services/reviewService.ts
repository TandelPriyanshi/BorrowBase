import axios from 'axios';
// Helper function to get the auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

const API_BASE_URL = 'http://localhost:3000/api/reviews';

interface SubmitReviewParams {
  userId: string;
  rating: number;
  message: string;
}

export const submitReview = async ({ userId, rating, message }: SubmitReviewParams) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}`,
      { user_id: userId, stars: rating, message },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        withCredentials: true
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error submitting review:', error);
    throw error;
  }
};

export const getUserReviews = async (userId: string): Promise<Array<{
  id: number;
  stars: number;
  message: string;
  created_at: string;
  reviewer_name: string;
  profile_pic_url: string;
  reviewer_id: number;
  user_id: number;
}>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${userId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    throw error;
  }
};
