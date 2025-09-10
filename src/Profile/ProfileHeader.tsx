import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Edit,
    MapPin,
    Phone,
    Mail,
    Star,
    Shield,
    Calendar,
    Award,
    TrendingUp,
} from "lucide-react";
import ApiService from "../services/apiService";
import api from "../utils/api";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorState from "../components/ui/ErrorState";

interface Statistics {
    borrowCount: number;
    lendCount: number;
    exchangeCount: number;
    totalResources: number;
    completedBorrows: number;
    completedLends: number;
    averageRating: number;
    totalRatings: number;
}

interface UserData {
    id: number;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    bio?: string;
    avatar_url?: string;
    is_email_verified: boolean;
    is_location_verified: boolean;
    average_rating: number;
    total_ratings: number;
    items_shared: number;
    successful_borrows: number;
    created_at: string;
}

interface CompleteProfile {
    user: UserData;
    statistics: Statistics;
    resources: any;
    borrowHistory: any[];
    lendHistory: any[];
    reviews: any;
}

const ProfileHeader = () => {
    const [profileData, setProfileData] = useState<CompleteProfile | null>(
        null
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await ApiService.getCompleteProfile();
                setProfileData(data.data || data);
            } catch (err: any) {
                console.error("Failed to fetch user profile", err);
                setError(
                    err?.response?.data?.message || "Failed to load profile"
                );
                setProfileData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, []);

    const handleProfileUpload = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("photo", file);

        try {
            const response = await api.post(
                "/api/profile/upload-profile-pic",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            const data = response.data;
            if (data.path) {
                setProfileData((prev) =>
                    prev
                        ? {
                              ...prev,
                              user: { ...prev.user, avatar_url: data.path },
                          }
                        : prev
                );
            }
        } catch (err) {
            console.error("Upload error", err);
        }
    };

    if (loading) {
        return (
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8 mb-6">
                <div className="flex items-center justify-center">
                    <LoadingSpinner size="lg" className="mr-4" />
                    <span className="text-gray-600 text-lg">
                        Loading your profile...
                    </span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8 mb-6">
                <ErrorState
                    title="Profile Error"
                    message={error}
                    onRetry={() => window.location.reload()}
                />
            </div>
        );
    }

    if (!profileData) {
        return (
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8 mb-6">
                <div className="text-center">
                    <div className="text-red-500 mb-4">
                        <Shield className="w-16 h-16 mx-auto" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Authentication Required
                    </h3>
                    <p className="text-gray-600">
                        Please log in to view your profile.
                    </p>
                </div>
            </div>
        );
    }

    const { user, statistics } = profileData;
    const joinDate = new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8 mb-6"
        >
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Profile Image */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="flex flex-col items-center"
                >
                    <div className="relative group">
                        <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden flex items-center justify-center shadow-2xl">
                            <AnimatePresence mode="wait">
                                {user.avatar_url ? (
                                    <motion.img
                                        key="avatar"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        src={`http://localhost:5173${
                                            user.avatar_url.startsWith("/")
                                                ? user.avatar_url
                                                : `/${user.avatar_url}`
                                        }`}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <motion.div
                                        key="placeholder"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        className="w-full h-full flex items-center justify-center text-white text-6xl font-bold"
                                    >
                                        {user.name.charAt(0).toUpperCase()}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Upload overlay */}
                        <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                            <label className="cursor-pointer text-white text-sm font-medium">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleProfileUpload}
                                    className="hidden"
                                />
                                <Edit size={20} className="mx-auto mb-1" />
                                Upload
                            </label>
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsEditing(!isEditing)}
                        className="mt-4 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
                    >
                        <Edit size={16} />
                        Edit Profile
                    </motion.button>
                </motion.div>

                {/* User Information */}
                <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="flex-1"
                >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                            {user.name}
                        </h1>
                        {user.average_rating > 0 && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.6 }}
                                className="flex items-center gap-2 px-3 py-1 bg-yellow-100 rounded-full"
                            >
                                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                <span className="text-lg font-semibold text-yellow-800">
                                    {user.average_rating.toFixed(1)}
                                </span>
                                <span className="text-yellow-700 text-sm">
                                    ({user.total_ratings} reviews)
                                </span>
                            </motion.div>
                        )}
                    </div>

                    {/* Contact Info */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
                    >
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                            <Mail className="w-5 h-5 text-blue-600" />
                            <span className="text-gray-700">{user.email}</span>
                            {user.is_email_verified && (
                                <Shield className="w-4 h-4 text-green-600" />
                            )}
                        </div>
                        {user.phone && (
                            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                                <Phone className="w-5 h-5 text-green-600" />
                                <span className="text-gray-700">
                                    {user.phone}
                                </span>
                            </div>
                        )}
                        {user.address && (
                            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                                <MapPin className="w-5 h-5 text-purple-600" />
                                <span className="text-gray-700 truncate">
                                    {user.address}
                                </span>
                                {user.is_location_verified && (
                                    <Shield className="w-4 h-4 text-green-600" />
                                )}
                            </div>
                        )}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <Calendar className="w-5 h-5 text-gray-600" />
                            <span className="text-gray-700">
                                Joined {joinDate}
                            </span>
                        </div>
                    </motion.div>

                    {/* Bio */}
                    {user.bio && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="mb-6"
                        >
                            <h3 className="text-lg font-semibold mb-3 text-gray-800">
                                About
                            </h3>
                            <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl">
                                {user.bio}
                            </p>
                        </motion.div>
                    )}

                    {/* Statistics */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200"
                        >
                            <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-blue-700">
                                {statistics.borrowCount}
                            </div>
                            <div className="text-sm text-blue-600 font-medium">
                                Borrowed
                            </div>
                        </motion.div>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200"
                        >
                            <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-green-700">
                                {statistics.lendCount}
                            </div>
                            <div className="text-sm text-green-600 font-medium">
                                Lent
                            </div>
                        </motion.div>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200"
                        >
                            <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-purple-700">
                                {statistics.exchangeCount}
                            </div>
                            <div className="text-sm text-purple-600 font-medium">
                                Exchanges
                            </div>
                        </motion.div>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200"
                        >
                            <Award className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-orange-700">
                                {statistics.totalResources}
                            </div>
                            <div className="text-sm text-orange-600 font-medium">
                                Total Items
                            </div>
                        </motion.div>
                    </motion.div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default ProfileHeader;
