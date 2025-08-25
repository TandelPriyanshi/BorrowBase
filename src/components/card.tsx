// src/Component/Card.tsx
import axios from "axios";
import { useState, useEffect } from "react";
import Button from "./button";
import { useNavigate } from "react-router-dom";
import { FaStar, FaStarHalfAlt, FaRegStar, FaComment } from "react-icons/fa";
import LeaveAReviewButton from "./LeaveAReviewButton";
import ReviewModal from "./ReviewModal";
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

const getDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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
  const [currentReviewCount, setCurrentReviewCount] = useState(initialReviewCount);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

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
      const response = await axios.get(
        `http://localhost:3000/api/reviews/${owner_id}`,
        { withCredentials: true }
      );
      const reviews = response.data;
      if (reviews && reviews.length > 0) {
        const totalRating = reviews.reduce(
          (sum: number, review: any) => sum + review.stars,
          0
        );
        const avgRating = totalRating / reviews.length;
        setCurrentRating(parseFloat(avgRating.toFixed(1)));
        setCurrentReviewCount(reviews.length);
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
      stars.push(<FaStar key={`full-${i}`} className="text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-yellow-400" />);
    }

    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="text-yellow-400" />);
    }

    return stars;
  };

  const navigate = useNavigate();

  let imageUrl = "";
  if (photo) {
    if (photo.startsWith("uploads/")) {
      imageUrl = `http://localhost:3000/${photo}`;
    } else if (photo.startsWith("/uploads/")) {
      imageUrl = `http://localhost:3000${photo}`;
    } else {
      imageUrl = `http://localhost:3000/uploads/resource/no-image.jpg`;
    }
  } else {
    imageUrl = `http://localhost:3000/uploads/resource/no-image.jpg`;
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

  const handleBorrow = async () => {
    try {
      const res = await axios.post(
        "http://localhost:3000/api/borrow",
        {
          resource_id,
          message: `Hi, I would like to borrow your item: ${title}`,
        },
        { withCredentials: true }
      );
      alert(res.data.message);
      alert("Please wait for the owner to accept your request.");
    } catch (err: any) {
      console.error("Borrow request failed:", err);
      alert(err?.response?.data?.error || "Something went wrong");
    }
  };

  const handleStartChat = async () => {
    try {
      if (!owner_id || !current_user_id) {
        alert("User ID not found");
        return;
      }
      const res = await axios.post(
        "http://localhost:3000/api/chat",
        {
          user1_id: current_user_id,
          user2_id: owner_id,
        },
        { withCredentials: true }
      );
      const chatId = res.data.id;
      navigate(`/chat/${chatId}`);
    } catch (err: any) {
      console.error("Start chat failed:", err);
      alert("Error starting chat.");
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [resource_id]);

  const handleReviewClick = () => {
    setIsReviewModalOpen(true);
  };

  return (
    <div className="bg-gray-900 text-white rounded-2xl shadow-lg overflow-hidden hover:scale-[1.02] transition-transform duration-300 flex flex-col h-full">
      {/* Image */}
      <div className="relative w-full h-48">
        <img 
          src={imageUrl} 
          alt={title} 
          className="w-full h-full object-cover" 
        />
      </div>
  
      {/* Content Wrapper - Takes remaining space */}
      <div className="p-5 flex flex-col flex-grow">
        {/* Main Content */}
        <div className="flex-grow">
          <h3 className="text-xl font-semibold line-clamp-1">{title}</h3>
          <p className="text-sm text-gray-400 italic mt-1">Owner: {owner_name}</p>
          {owner_address && <p className="text-sm text-gray-400">{owner_address}</p>}
          {distance && <p className="text-sm text-green-400">{distance}</p>}
  
          <p className="text-sm text-gray-300 mt-2 line-clamp-2">{description}</p>
  
          {type?.trim() && (
            <span className="inline-block px-3 py-1 bg-gray-700 text-xs rounded-full capitalize w-fit mt-2">
              {type}
            </span>
          )}
  
          {/* Reviews Section */}
          <div className="mt-3">
            <div className="flex items-center justify-between">
              <div 
                className="flex items-center gap-2 cursor-pointer hover:opacity-80"
                onClick={handleReviewClick}
              >
                <div className="flex items-center gap-1">
                  {renderStars(currentRating)}
                  <span className="text-sm text-gray-400 ml-1">
                    ({currentReviewCount} {currentReviewCount === 1 ? "review" : "reviews"})
                  </span>
                </div>
              </div>
  
              {currentRating > 0 && (
                <div className="flex items-center text-sm text-yellow-400">
                  <FaComment className="mr-1" />
                  <span>{currentRating.toFixed(1)} / 5</span>
                </div>
              )}
            </div>
          </div>
        </div>
  
        {/* Action Buttons - Pushed to bottom */}
        <div className="mt-4 pt-3 border-t border-gray-800">
        <div className="mb-5">
            <LeaveAReviewButton
              userId={owner_id.toString()}
              userName={owner_name}
              onReviewSubmitted={handleReviewSubmitted}
            />
          </div>
          <div className="flex gap-3">
            <Button 
              buttonName="Borrow" 
              onClick={handleBorrow} 
              type="button"
            />
            <Button 
              buttonName="Chat" 
              onClick={handleStartChat} 
              type="button" 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
