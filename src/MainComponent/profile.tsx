import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProfileHeader from "../Profile/ProfileHeader";
import ProfileTabs from "../Profile/ProfileTabs";
import ProfileContent from "../Profile/ProfileContent";
import ApiService from "../services/apiService";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorState from "../components/ui/ErrorState";

interface CompleteProfile {
    user: any;
    statistics: any;
    resources: any;
    borrowHistory: any[];
    lendHistory: any[];
    reviews: any;
}

const Profile = () => {
    const [activeTab, setActiveTab] = useState("Requested");
    const [profileData, setProfileData] = useState<CompleteProfile | null>(
        null
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await ApiService.getCompleteProfile();
            setProfileData(data.data || data);
        } catch (err: any) {
            console.error("Failed to fetch profile", err);
            setError("Failed to load profile data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full opacity-10 blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full opacity-10 blur-3xl"></div>
            </div>

            <div className="relative z-10">
                <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
                    <AnimatePresence mode="wait">
                        {loading && (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center min-h-[60vh]"
                            >
                                <LoadingSpinner size="lg" className="mb-4" />
                                <h2 className="text-xl font-semibold text-white mb-2">
                                    Loading Profile
                                </h2>
                                <p className="text-gray-300 text-center max-w-md">
                                    We're gathering your profile information,
                                    resources, and activity...
                                </p>
                            </motion.div>
                        )}

                        {error && !loading && (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="min-h-[60vh] flex items-center justify-center"
                            >
                                <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-red-500/20 p-8">
                                    <ErrorState
                                        title="Profile Load Error"
                                        message={error}
                                        onRetry={fetchProfile}
                                        className="max-w-md"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {!loading && !error && (
                            <motion.div
                                key="profile"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                {/* Profile Header */}
                                <motion.div
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <ProfileHeader profileData={profileData} />
                                </motion.div>

                                {/* Profile Tabs */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <ProfileTabs
                                        activeTab={activeTab}
                                        setActiveTab={setActiveTab}
                                    />
                                </motion.div>

                                {/* Profile Content */}
                                <motion.div
                                    initial={{ y: 30, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <ProfileContent
                                        activeTab={activeTab}
                                        profileData={profileData}
                                    />
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Profile;
