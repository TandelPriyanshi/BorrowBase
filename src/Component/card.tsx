import axios from "axios";
import Button from "./button";
import { useNavigate } from "react-router-dom";

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
  owner_longitude,
  owner_address,
  current_latitude,
  current_longitude,
}: CardProps) => {
  const navigate = useNavigate();
  let imageUrl = "";

  if (photo) {
    if (photo.startsWith("/uploads")) {
      imageUrl = `http://localhost:3000${photo}`;
    } else if (photo.startsWith("uploads")) {
      imageUrl = `http://localhost:3000/${photo}`;
    } else {
      imageUrl = `http://localhost:3000/uploads/resource/no-image.jpg`;
    }
  } else {
    imageUrl = `http://localhost:3000/uploads/resource/no-image.jpg`;
  }

  let distance: string | null = null;

  if (
    owner_latitude &&
    owner_longitude &&
    current_latitude &&
    current_longitude
  ) {
    const dist = getDistanceInKm(
      current_latitude,
      current_longitude,
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
        {
          withCredentials: true,
        }
      );
      alert(res.data.message);
      alert("Please wait for the owner to accept your request.");
      console.log("Borrow request successful:", res.data);
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
  
      console.log("Starting chat between", current_user_id, "and", owner_id);
  
      const res = await axios.post(
        "http://localhost:3000/api/chat",
        {
          user1_id: current_user_id,
          user2_id: owner_id,
        },
        {
          withCredentials: true,
        }
      );
  
      const chatId = res.data.id;
      navigate(`/chat/${chatId}`);
    } catch (err: any) {
      console.error("Start chat failed:", err);
      alert("Error starting chat.");
    }
  };
  

  return (
    <div className="bg-gray-800 text-white rounded-lg shadow-md overflow-hidden">
      <img
        src={imageUrl}
        alt={title}
        className="w-full h-30 object-cover"
      />

      <div className="p-4 h-60">
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-sm text-gray-400 italic mt-1">Owner: {owner_name}</p>

        {owner_address && (
          <p className="text-sm text-gray-400 mt-1">{owner_address}</p>
        )}

        {distance && (
          <p className="text-sm text-green-400 mt-1">{distance}</p>
        )}

        <p className="text-sm text-gray-300 mt-2">{description}</p>

        {type?.trim() && (
          <span className="inline-block mt-2 px-3 py-1 bg-gray-600 text-sm rounded-full capitalize">
            {type}
          </span>
        )}
      </div>

      <div className="p-4 flex gap-3">
        <Button buttonName="Borrow" onClick={handleBorrow} type="button" />
        <Button buttonName="Chat" onClick={handleStartChat} type="button" />
      </div>
    </div>
  );
};

export default Card;