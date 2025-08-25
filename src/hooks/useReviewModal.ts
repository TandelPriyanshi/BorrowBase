import { useState } from 'react';

interface ReviewModalState {
  isOpen: boolean;
  userId: string;
  userName: string;
  onReviewSubmitted?: () => void;
}

export const useReviewModal = () => {
  const [modalState, setModalState] = useState<ReviewModalState>({
    isOpen: false,
    userId: '',
    userName: '',
    onReviewSubmitted: undefined,
  });

  const openModal = (userId: string, userName: string, onReviewSubmitted?: () => void) => {
    setModalState({
      isOpen: true,
      userId,
      userName,
      onReviewSubmitted,
    });
  };

  const closeModal = () => {
    setModalState(prev => ({
      ...prev,
      isOpen: false,
    }));
  };

  return {
    isOpen: modalState.isOpen,
    userId: modalState.userId,
    userName: modalState.userName,
    onReviewSubmitted: modalState.onReviewSubmitted,
    openModal,
    closeModal,
  };
};

export default useReviewModal;
