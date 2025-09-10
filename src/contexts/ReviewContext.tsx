import { createContext, useContext } from 'react';
import type { FC, ReactNode } from 'react';
import { useReviewModal } from '../hooks/useReviewModal';
import RatingReview from '../components/RatingReview';

interface ReviewContextType {
  openReviewModal: (userId: string, userName: string, onReviewSubmitted?: () => void) => void;
  closeReviewModal: () => void;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export const ReviewProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const {
    isOpen,
    userId,
    userName,
    onReviewSubmitted,
    openModal: openReviewModal,
    closeModal: closeReviewModal,
  } = useReviewModal();

  return (
    <ReviewContext.Provider value={{ openReviewModal, closeReviewModal }}>
      {children}
      {isOpen && userId && userName && (
        <RatingReview
          userId={userId}
          userName={userName}
          onClose={closeReviewModal}
          onReviewSubmitted={onReviewSubmitted}
        />
      )}
    </ReviewContext.Provider>
  );
};

export const useReview = (): ReviewContextType => {
  const context = useContext(ReviewContext);
  if (context === undefined) {
    throw new Error('useReview must be used within a ReviewProvider');
  }
  return context;
};

export default ReviewContext;
