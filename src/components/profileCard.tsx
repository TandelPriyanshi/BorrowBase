// src/Component/ProfileCard.tsx

import { Camera } from "lucide-react";
import Button from "./button";

export interface ProfileCardProps {
    id: number;
    title: string;
    description: string;
    photo?: string | { photo_url: string };
    showReturn?: boolean;
    showCancel?: boolean;
    onReturn?: () => void;
    onCancel?: () => void;
    status?: string;
    requestDate?: string;
    ownerName?: string;
}

export const ProfileCard = ({
    title,
    description,
    photo,
    showReturn,
    showCancel,
    onReturn,
    onCancel,
    status,
    requestDate,
    ownerName,
}: ProfileCardProps) => {
    // Handle both string URLs and photo objects
    const photoUrl = typeof photo === "string" ? photo : photo?.photo_url;

    // Helper function to construct proper URLs without double slashes
    const constructImageUrl = (path: string) => {
        const cleanPath = path.startsWith("/") ? path : `/${path}`;
        return `http://localhost:5173${cleanPath}`;
    };

    return (
        <div className="group bg-gradient-to-br from-gray-800 to-gray-900 text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-gray-700 hover:border-gray-600">
            {/* Image Container */}
            <div className="relative overflow-hidden rounded-xl mb-4">
                {photoUrl ? (
                    <img
                        src={constructImageUrl(photoUrl)}
                        alt="Resource"
                        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center rounded-xl">
                        <Camera size={32} className="text-gray-400" />
                    </div>
                )}
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
            </div>

            {/* Content */}
            <div className="space-y-3">
                <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors duration-200 line-clamp-1">
                    {title}
                </h3>
                <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">
                    {description}
                </p>

                {/* Additional info for borrow requests */}
                {ownerName && (
                    <div className="text-xs text-gray-400">
                        Owner:{" "}
                        <span className="text-blue-300">{ownerName}</span>
                    </div>
                )}

                {status && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Status:</span>
                        <span
                            className={`text-xs px-2 py-1 rounded-full ${
                                status === "pending"
                                    ? "bg-yellow-500/20 text-yellow-300"
                                    : status === "approved"
                                    ? "bg-green-500/20 text-green-300"
                                    : status === "rejected"
                                    ? "bg-red-500/20 text-red-300"
                                    : "bg-gray-500/20 text-gray-300"
                            }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                    </div>
                )}

                {requestDate && (
                    <div className="text-xs text-gray-400">
                        Requested: {new Date(requestDate).toLocaleDateString()}
                    </div>
                )}
            </div>

            {/* Action Button */}
            {(showReturn || showCancel) && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    {showCancel && onCancel && (
                        <Button
                            buttonName="Cancel Request"
                            type="button"
                            onClick={onCancel}
                            className="w-full bg-orange-600 hover:bg-orange-700 border-orange-600 hover:border-orange-700 text-white font-medium transition-colors duration-200"
                        />
                    )}
                    {showReturn && onReturn && (
                        <Button
                            buttonName="Return"
                            type="button"
                            onClick={onReturn}
                            className="w-full bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700 text-white font-medium transition-colors duration-200"
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default ProfileCard;