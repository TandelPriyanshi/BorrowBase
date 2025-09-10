// src/Component/Card.tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ApiService from "../services/apiService";
import Button from "./button";
import { useNavigate } from "react-router-dom";
import {
    FaStar,
    FaStarHalfAlt,
    FaRegStar,
    FaComment,
    FaMapMarkerAlt,
    FaUser,
    FaHeart,
} from "react-icons/fa";
import LoadingSpinner from "./ui/LoadingSpinner";
import LeaveAReviewButton from "./LeaveAReviewButton";
import ReviewModal from "./ReviewModal";
import BorrowRequestModal from "./BorrowRequestModal";
import { toast } from "react-toastify";

interface CardProps {
    resource_id: number;
    title: string;
    description: string;
    type?: string;
    photo?: string;
    owner_name: string;
    owner_id: number;
    current_user_id: number;
    owner_latitude?: number;
    owner_longitude?: number;
    owner_address?: string;
    current_latitude?: number;
    current_longitude?: number;
    rating?: number;
    reviewCount?: number;
    onReviewSubmitted?: () => void;
}

const getDistanceInKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const Card = ({
    resource_id,
    title,
    description,
    type,
    photo,
    owner_name,
    owner_id,
    current_user_id,
    owner_latitude,
    current_latitude: currentLat,
    current_longitude: currentLon,
    owner_longitude,
    owner_address,
    rating: initialRating = 0,
    reviewCount: initialReviewCount = 0,
    onReviewSubmitted,
}: CardProps) => {
    const [currentRating, setCurrentRating] = useState(initialRating);
    const [currentReviewCount, setCurrentReviewCount] =
        useState(initialReviewCount);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        setCurrentRating(initialRating);
        setCurrentReviewCount(initialReviewCount);
    }, [initialRating, initialReviewCount]);

    const handleReviewSubmitted = () => {
        fetchReviews();
        if (onReviewSubmitted) onReviewSubmitted();
        toast.success("Thank you for your review!");
    };

    const fetchReviews = async () => {
        try {
            const response = await ApiService.getUserReviews(owner_id);
            const result = response.data || response;

            if (result.reviews && result.reviews.length > 0) {
                setCurrentRating(result.averageRating || 0);
                setCurrentReviewCount(result.totalReviews || 0);
            }
        } catch (error) {
            console.error("Error fetching reviews:", error);
        }
    };

    const renderStars = (rating: number) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        for (let i = 0; i < fullStars; i++) {
            stars.push(
                <FaStar key={`full-${i}`} className="text-yellow-400" />
            );
        }

        if (hasHalfStar) {
            stars.push(
                <FaStarHalfAlt key="half" className="text-yellow-400" />
            );
        }

        for (let i = 0; i < emptyStars; i++) {
            stars.push(
                <FaRegStar key={`empty-${i}`} className="text-yellow-400" />
            );
        }

        return stars;
    };

    const navigate = useNavigate();

    let imageUrl = "";
    if (photo && typeof photo === "string") {
        if (photo.startsWith("http://") || photo.startsWith("https://")) {
            // Full URL provided
            imageUrl = photo;
        } else if (photo.startsWith("/uploads/")) {
            // Relative path starting with / - serve from frontend
            imageUrl = `http://localhost:5173${photo}`;
        } else if (photo.startsWith("uploads/")) {
            // Relative path without leading /
            imageUrl = `http://localhost:5173/${photo}`;
        } else {
            // Invalid photo format, use default
            imageUrl = `http://localhost:5173/uploads/resource/no-image.jpg`;
        }
    } else {
        imageUrl = `http://localhost:5173/uploads/resource/no-image.jpg`;
    }

    let distance: string | null = null;
    if (owner_latitude && owner_longitude && currentLat && currentLon) {
        const dist = getDistanceInKm(
            currentLat,
            currentLon,
            owner_latitude,
            owner_longitude
        );
        distance = `${dist.toFixed(1)} km away`;
    }

    const handleBorrow = () => {
        setIsBorrowModalOpen(true);
    };

    const handleStartChat = async () => {
        try {
            // Debug owner name for troubleshooting
            console.log(
                "Starting chat - owner_name:",
                owner_name,
                "(type:",
                typeof owner_name,
                ")"
            );

            if (!owner_id || !current_user_id) {
                return;
            }

            if (owner_id === current_user_id) {
                return;
            }

            // Store the owner name before API call - handle various formats
            const ownerDisplayName = owner_name || "Unknown User";
            console.log("Chat Debug - ownerDisplayName:", ownerDisplayName);

            const response = await ApiService.createChat(owner_id);
            console.log("Chat API Response:", response);

            const chatData = response.data || response;
            const chatId = chatData.id || chatData.chat_id;

            // Navigate to chat regardless of whether we get a chatId or not
            navigate(`/chat`);
        } catch (err: any) {
            console.error("Start chat failed:", err);
            const errorMessage =
                err?.response?.data?.message ||
                err?.message ||
                "Error starting chat";

            // For most chat errors, still try to navigate to chat page
            // This handles cases where chat already exists or other non-critical errors
            if (
                err?.response?.status === 409 || // Conflict - chat exists
                err?.response?.status === 200 || // Success but different format
                errorMessage.toLowerCase().includes("already") ||
                errorMessage.toLowerCase().includes("exists")
            ) {
                navigate(`/chat`);
            }
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [resource_id]);

    const handleReviewClick = () => {
        setIsReviewModalOpen(true);
    };

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            electronics: "bg-blue-500/20 text-blue-300 border-blue-500/30",
            books: "bg-green-500/20 text-green-300 border-green-500/30",
            tools: "bg-orange-500/20 text-orange-300 border-orange-500/30",
            furniture: "bg-purple-500/20 text-purple-300 border-purple-500/30",
            sports: "bg-red-500/20 text-red-300 border-red-500/30",
            clothing: "bg-pink-500/20 text-pink-300 border-pink-500/30",
            default: "bg-gray-500/20 text-gray-300 border-gray-500/30",
        };
        return colors[type.toLowerCase()] || colors.default;
    };

    return (
        <motion.div
            className="group relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden h-full flex flex-col"
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
        >
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Image Section */}
            <div className="relative h-48 overflow-hidden">
                <motion.img
                    src={
                        imageError
                            ? "http://localhost:5173/uploads/resource/no-image.jpg"
                            : imageUrl
                    }
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={() => setImageError(true)}
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                />

                {/* Overlay with favorite button */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

                {/* Type Badge */}
                {type?.trim() && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${getTypeColor(
                            type
                        )}`}
                    >
                        {type}
                    </motion.div>
                )}

                {/* Distance Badge */}
                {distance && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30 backdrop-blur-sm flex items-center gap-1"
                    >
                        <FaMapMarkerAlt className="text-[10px]" />
                        {distance}
                    </motion.div>
                )}

                {/* Favorite Button */}
                <motion.button
                    className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsFavorited(!isFavorited)}
                >
                    <FaHeart
                        className={`text-sm ${
                            isFavorited ? "text-red-400" : "text-white/70"
                        }`}
                    />
                </motion.button>
            </div>

            {/* Content Section */}
            <div className="p-6 flex flex-col flex-grow relative z-10">
                {/* Title and Owner */}
                <div className="mb-4">
                    <motion.h3
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-blue-300 transition-colors duration-200"
                    >
                        {title}
                    </motion.h3>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="flex items-center gap-2 text-sm text-gray-300"
                    >
                        <FaUser className="text-xs" />
                        <span>by {owner_name}</span>
                    </motion.div>

                    {owner_address && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center gap-2 text-xs text-gray-400 mt-1"
                        >
                            <FaMapMarkerAlt className="text-[10px]" />
                            <span>{owner_address}</span>
                        </motion.div>
                    )}
                </div>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm text-gray-300 line-clamp-2 mb-4 flex-grow"
                >
                    {description}
                </motion.p>

                {/* Reviews Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mb-4"
                >
                    <div
                        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity duration-200"
                        onClick={handleReviewClick}
                    >
                        <div className="flex items-center gap-1">
                            {renderStars(currentRating)}
                        </div>
                        <span className="text-xs text-gray-400">
                            ({currentReviewCount}{" "}
                            {currentReviewCount === 1 ? "review" : "reviews"})
                        </span>
                        {currentRating > 0 && (
                            <span className="text-xs text-yellow-400 font-medium">
                                {currentRating.toFixed(1)}/5
                            </span>
                        )}
                    </div>
                </motion.div>

                {/* Review Button */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mb-4"
                >
                    <LeaveAReviewButton
                        userId={owner_id.toString()}
                        userName={owner_name}
                        onReviewSubmitted={handleReviewSubmitted}
                    />
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex gap-3 mt-auto"
                >
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleBorrow}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 shadow-lg hover:shadow-xl"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <LoadingSpinner size="sm" className="mx-auto" />
                        ) : (
                            "Borrow"
                        )}
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleStartChat}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 shadow-lg hover:shadow-xl"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <LoadingSpinner size="sm" className="mx-auto" />
                        ) : (
                            "Chat"
                        )}
                    </motion.button>
                </motion.div>
            </div>

            {/* Modals */}
            <ReviewModal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                resourceId={owner_id}
            />

            <BorrowRequestModal
                isOpen={isBorrowModalOpen}
                onClose={() => setIsBorrowModalOpen(false)}
                resourceId={resource_id}
                resourceTitle={title}
                ownerName={owner_name}
            />
        </motion.div>
    );
};

export default Card;
