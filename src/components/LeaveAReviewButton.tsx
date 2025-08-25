import React from 'react';
import { useReview } from '../contexts/ReviewContext';
import Button from './button';

interface LeaveAReviewButtonProps {
  userId: string;
  userName: string;
  className?: string;
  onReviewSubmitted?: () => void;
  children?: React.ReactNode;
}

const LeaveAReviewButton: React.FC<LeaveAReviewButtonProps> = ({
  userId,
  userName,
  onReviewSubmitted,
  children,
}) => {
  const { openReviewModal } = useReview();

  const handleClick = () => {
    openReviewModal(userId, userName, onReviewSubmitted);
  };

  return (
    <Button
      buttonName={children?.toString() || 'Review'}
      onClick={handleClick}
      type="button"
      className='w-full'
    />
  );
};

export default LeaveAReviewButton;
