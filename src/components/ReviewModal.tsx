import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import ApiService from "../services/apiService";
import {
    FaStar,
    FaStarHalfAlt,
    FaRegStar,
    FaTimes,
    FaUsers,
    FaQuoteLeft,
} from "react-icons/fa";
import LoadingSpinner from "./ui/LoadingSpinner";
import EmptyState from "./ui/EmptyState";
import ErrorState from "./ui/ErrorState";

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
    resourceId: number; // This is actually the user ID (owner_id)
}

const ReviewModal: React.FC<ReviewModalProps> = ({
    isOpen,
    onClose,
    resourceId,
}) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchReviews = async () => {
        try {
            setIsLoading(true);
            // Use the correct endpoint for fetching reviews by user ID
            const response = await ApiService.getUserReviews(resourceId);
            const data = response.data || response;
            setReviews(data.reviews || data);
            setError("");
        } catch (err) {
            console.error("Error fetching reviews:", err);
            setError("Failed to load reviews. Please try again later.");
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
            stars.push(
                <FaStar key={`full-${i}`} className="text-yellow-400 inline" />
            );
        }

        if (hasHalfStar) {
            stars.push(
                <FaStarHalfAlt key="half" className="text-yellow-400 inline" />
            );
        }

        for (let i = 0; i < emptyStars; i++) {
            stars.push(
                <FaRegStar
                    key={`empty-${i}`}
                    className="text-yellow-400 inline"
                />
            );
        }

        return stars;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const calculateAverageRating = () => {
        if (reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
        return sum / reviews.length;
    };

    const getRatingDistribution = () => {
        const distribution = [0, 0, 0, 0, 0];
        reviews.forEach((review) => {
            distribution[review.rating - 1]++;
        });
        return distribution;
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[1000] flex justify-center items-center p-4"
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 50 }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white/95 backdrop-blur-lg rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl border border-white/20 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="relative bg-gradient-to-r from-amber-400 to-orange-500 p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"
                                        >
                                            <FaUsers className="text-2xl" />
                                        </motion.div>
                                        <div>
                                            <motion.h3
                                                initial={{ x: -20, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                transition={{ delay: 0.1 }}
                                                className="text-2xl font-bold"
                                            >
                                                Reviews & Ratings
                                            </motion.h3>
                                            <motion.p
                                                initial={{ x: -20, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                transition={{ delay: 0.15 }}
                                                className="text-amber-100 text-sm"
                                            >
                                                What others say about this user
                                            </motion.p>
                                        </div>
                                    </div>
                                    <motion.button
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.25 }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={onClose}
                                        className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer"
                                        aria-label="Close"
                                    >
                                        <FaTimes className="text-lg" />
                                    </motion.button>
                                </div>

                                {/* Rating Overview */}
                                {!isLoading && !error && reviews.length > 0 && (
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/10 rounded-xl p-4"
                                    >
                                        <div className="text-center">
                                            <div className="text-4xl font-bold mb-2">
                                                {calculateAverageRating().toFixed(
                                                    1
                                                )}
                                            </div>
                                            <div className="flex justify-center mb-2">
                                                {renderStars(
                                                    calculateAverageRating()
                                                )}
                                            </div>
                                            <div className="text-white/80 text-sm">
                                                Based on {reviews.length}{" "}
                                                {reviews.length === 1
                                                    ? "review"
                                                    : "reviews"}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {getRatingDistribution()
                                                .map((count, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center space-x-2 text-sm"
                                                    >
                                                        <span className="w-3">
                                                            {5 - index}
                                                        </span>
                                                        <FaStar
                                                            className="text-white/80"
                                                            size={12}
                                                        />
                                                        <div className="flex-1 bg-white/20 rounded-full h-2">
                                                            <div
                                                                className="bg-white rounded-full h-full transition-all duration-1000"
                                                                style={{
                                                                    width: `${
                                                                        reviews.length >
                                                                        0
                                                                            ? (count /
                                                                                  reviews.length) *
                                                                              100
                                                                            : 0
                                                                    }%`,
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="w-6 text-right">
                                                            {count}
                                                        </span>
                                                    </div>
                                                ))
                                                .reverse()}
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="overflow-y-auto flex-1 p-6">
                                <AnimatePresence mode="wait">
                                    {isLoading && (
                                        <motion.div
                                            key="loading"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex flex-col items-center justify-center py-16"
                                        >
                                            <LoadingSpinner
                                                size="lg"
                                                className="mb-4"
                                            />
                                            <p className="text-gray-600 text-lg">
                                                Loading reviews...
                                            </p>
                                            <p className="text-gray-400 text-sm mt-2">
                                                Please wait while we fetch user
                                                feedback
                                            </p>
                                        </motion.div>
                                    )}

                                    {error && !isLoading && (
                                        <motion.div
                                            key="error"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                        >
                                            <ErrorState
                                                title="Failed to Load Reviews"
                                                message={error}
                                                onRetry={fetchReviews}
                                                className="py-16"
                                            />
                                        </motion.div>
                                    )}

                                    {!isLoading &&
                                        !error &&
                                        reviews.length === 0 && (
                                            <motion.div
                                                key="empty"
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.9,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                }}
                                                exit={{
                                                    opacity: 0,
                                                    scale: 0.9,
                                                }}
                                            >
                                                <EmptyState
                                                    icon={
                                                        <svg
                                                            className="w-full h-full"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={1}
                                                                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                                            />
                                                        </svg>
                                                    }
                                                    title="No Reviews Yet"
                                                    description="This user hasn't received any reviews yet. Be the first to share your experience!"
                                                    className="py-16"
                                                />
                                            </motion.div>
                                        )}

                                    {!isLoading &&
                                        !error &&
                                        reviews.length > 0 && (
                                            <motion.div
                                                key="reviews"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="space-y-6"
                                            >
                                                {reviews.map(
                                                    (review, index) => (
                                                        <motion.div
                                                            key={review.id}
                                                            initial={{
                                                                opacity: 0,
                                                                y: 20,
                                                            }}
                                                            animate={{
                                                                opacity: 1,
                                                                y: 0,
                                                            }}
                                                            transition={{
                                                                delay:
                                                                    index * 0.1,
                                                            }}
                                                            className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200/50 relative"
                                                        >
                                                            <FaQuoteLeft className="absolute top-4 right-4 text-blue-200 text-2xl" />

                                                            <div className="flex items-start justify-between mb-4">
                                                                <div className="flex items-center space-x-3">
                                                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                                        {review.reviewer_name
                                                                            .charAt(
                                                                                0
                                                                            )
                                                                            .toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-bold text-gray-900 text-lg">
                                                                            {
                                                                                review.reviewer_name
                                                                            }
                                                                        </h4>
                                                                        <div className="flex items-center space-x-2">
                                                                            <div className="flex">
                                                                                {renderStars(
                                                                                    review.rating
                                                                                )}
                                                                            </div>
                                                                            <span className="text-sm text-gray-500">
                                                                                {formatDate(
                                                                                    review.created_at
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                                                    {
                                                                        review.rating
                                                                    }
                                                                    .0/5
                                                                </div>
                                                            </div>

                                                            {review.message && (
                                                                <div className="bg-white/70 rounded-lg p-4 relative">
                                                                    <p className="text-gray-700 leading-relaxed italic">
                                                                        "
                                                                        {
                                                                            review.message
                                                                        }
                                                                        "
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    )
                                                )}
                                            </motion.div>
                                        )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ReviewModal;
