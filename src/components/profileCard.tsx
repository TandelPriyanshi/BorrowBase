// src/Component/ProfileCard.tsx

import { Camera } from "lucide-react";
import Button from "./button";

interface ProfileCardProps {
  id: number;
  title: string;
  description: string;
  photo?: string;
  showReturn?: boolean;
  onReturn?: () => void;
}

const ProfileCard = ({
  title,
  description,
  photo,
  showReturn,
  onReturn,
}: ProfileCardProps) => {
  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg shadow-md">
      {photo ? (
        <img
          src={`http://localhost:3000/${photo}`}
          alt="Resource"
          className="w-full h-48 object-cover rounded mb-4"
        />
      ) : (
        <div className="w-full h-48 bg-gray-700 flex items-center justify-center rounded mb-4">
          <Camera size={32} className="text-gray-500" />
        </div>
      )}

      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-sm mt-1">{description}</p>

      {showReturn && onReturn && (
        <div className="mt-4">
          <Button buttonName="Return" type="button" onClick={onReturn} />
        </div>
      )}
    </div>
  );
};

export default ProfileCard;
