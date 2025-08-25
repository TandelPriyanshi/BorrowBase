# Review System

This document explains how to use the review system in the BorrowBase application.

## Features

- Leave star ratings (1-5 stars)
- Write detailed reviews
- Add quick tags to describe the experience
- View average ratings and individual reviews

## How to Use the Review Component

### 1. Using the LeaveAReviewButton Component

The easiest way to add a review button is to use the `LeaveAReviewButton` component:

```tsx
import LeaveAReviewButton from './components/LeaveAReviewButton';

// In your component:
<LeaveAReviewButton 
  userId="123" 
  userName="John Doe"
  className="your-custom-class"
  onReviewSubmitted={() => {
    // Optional: Handle successful review submission
    console.log('Review was submitted!');
  }}
>
  Leave a Review
</LeaveAReviewButton>
```

### 2. Using the useReview Hook

For more control, you can use the `useReview` hook directly:

```tsx
import { useReview } from './contexts/ReviewContext';

function YourComponent() {
  const { openReviewModal } = useReview();

  const handleButtonClick = () => {
    openReviewModal(
      '123', // User ID
      'John Doe', // User Name
      () => {
        // Optional: Callback when review is submitted
        console.log('Review was submitted!');
      }
    );
  };

  return (
    <button onClick={handleButtonClick}>
      Leave a Review
    </button>
  );
}
```

## Displaying User Ratings

To display a user's average rating:

1. First, fetch the user's reviews:

```tsx
import { getUserReviews } from './services/reviewService';

// In your component:
const [averageRating, setAverageRating] = useState(0);

useEffect(() => {
  const fetchReviews = async () => {
    try {
      const reviews = await getUserReviews(userId);
      if (reviews.length > 0) {
        const total = reviews.reduce((sum, review) => sum + review.rating, 0);
        setAverageRating(total / reviews.length);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  fetchReviews();
}, [userId]);
```

2. Then display the rating:

```tsx
<div className="flex items-center">
  {[1, 2, 3, 4, 5].map((star) => (
    <span 
      key={star} 
      className={`text-xl ${star <= Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
    >
      ★
    </span>
  ))}
  <span className="ml-2 text-sm text-gray-600">
    ({averageRating.toFixed(1)} from {reviews.length} reviews)
  </span>
</div>
```

## Styling

The review modal is styled using Tailwind CSS. You can customize the appearance by:

1. Adding custom classes to the `LeaveAReviewButton` component
2. Modifying the `RatingReview` component's styles in `RatingReview.tsx`
3. Overriding Tailwind classes in your `tailwind.config.js`

## Backend Integration

The review system requires the following database tables:

1. `reviews` - Stores individual reviews
2. `users` - Should have a `rating` column to store the average rating

Make sure to run the database migrations before using the review system.

## Running Migrations

```bash
npm run migrate
```

This will create the necessary database tables and columns if they don't already exist.
