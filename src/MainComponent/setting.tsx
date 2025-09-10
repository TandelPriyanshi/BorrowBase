import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../Auth/authContext";
import { useNavigate } from "react-router-dom";
import {
    FaUser,
    FaEnvelope,
    FaLock,
    FaBell,
    FaPalette,
    FaShield,
    FaSignOutAlt,
    FaSave,
    FaEdit,
    FaMapMarkerAlt,
    FaEye,
    FaEyeSlash,
} from "react-icons/fa";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { toast } from "react-toastify";
import ApiService from "../services/apiService";

interface UserSettings {
    name: string;
    email: string;
    address: string;
    notifications: {
        email: boolean;
        push: boolean;
        marketing: boolean;
    };
    privacy: {
        profileVisibility: "public" | "private";
        showLocation: boolean;
        showActivity: boolean;
    };
}

const Settings = () => {
    const [settings, setSettings] = useState<UserSettings>({
        name: "",
        email: "",
        address: "",
        notifications: {
            email: true,
            push: true,
            marketing: false,
        },
        privacy: {
            profileVisibility: "public",
            showLocation: true,
            showActivity: true,
        },
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeSection, setActiveSection] = useState("profile");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const { logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            setLoading(true);
            const response = await ApiService.getProfile();
            const userData = response.data || response;

            setSettings((prev) => ({
                ...prev,
                name: userData.name || "",
                email: userData.email || "",
                address: userData.address || "",
            }));
        } catch (error) {
            console.error("Failed to fetch user data:", error);
            toast.error("Failed to load user settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            setSaving(true);
            await ApiService.updateProfile({
                name: settings.name,
                address: settings.address,
            });
            toast.success("Profile updated successfully!");
        } catch (error) {
            console.error("Failed to save profile:", error);
            toast.error("Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }
        if (passwordData.newPassword.length < 6) {
            toast.error("Password must be at least 6 characters long");
            return;
        }

        try {
            setSaving(true);
            // Assuming there's an endpoint for changing password
            await ApiService.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            toast.success("Password changed successfully!");
            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        } catch (error: any) {
            console.error("Failed to change password:", error);
            toast.error(
                error.response?.data?.message || "Failed to change password"
            );
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            // Call the auth context logout function
            logout();
            // Additional cleanup
            sessionStorage.clear();
            toast.success("Logged out successfully");
        } catch (error) {
            console.error("Logout error:", error);
            // Force logout even if there's an error
            logout();
            sessionStorage.clear();
        }
    };

    const sections = [
        { id: "profile", label: "Profile", icon: FaUser },
        { id: "security", label: "Security", icon: FaShield },
        { id: "notifications", label: "Notifications", icon: FaBell },
        { id: "privacy", label: "Privacy", icon: FaLock },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="lg" className="mb-4" />
                    <p className="text-gray-300">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full opacity-10 blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full opacity-10 blur-3xl"></div>
            </div>

            <div className="relative z-10">
                <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="mb-8"
                    >
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Settings
                        </h1>
                        <p className="text-gray-300">
                            Manage your account preferences and settings
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Sidebar */}
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="lg:col-span-1"
                        >
                            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
                                <nav className="space-y-2">
                                    {sections.map((section) => {
                                        const Icon = section.icon;
                                        return (
                                            <motion.button
                                                key={section.id}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() =>
                                                    setActiveSection(section.id)
                                                }
                                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                                                    activeSection === section.id
                                                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                                                        : "text-gray-300 hover:bg-white/10 hover:text-white"
                                                }`}
                                            >
                                                <Icon className="text-lg" />
                                                <span className="font-medium">
                                                    {section.label}
                                                </span>
                                            </motion.button>
                                        );
                                    })}

                                    {/* Logout Button */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleLogout}
                                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 mt-8"
                                    >
                                        <FaSignOutAlt className="text-lg" />
                                        <span className="font-medium">
                                            Logout
                                        </span>
                                    </motion.button>
                                </nav>
                            </div>
                        </motion.div>

                        {/* Content */}
                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="lg:col-span-3"
                        >
                            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
                                <AnimatePresence mode="wait">
                                    {/* Profile Section */}
                                    {activeSection === "profile" && (
                                        <motion.div
                                            key="profile"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="space-y-6"
                                        >
                                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                                                <FaUser className="mr-3" />
                                                Profile Information
                                            </h2>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                                        Full Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={settings.name}
                                                        onChange={(e) =>
                                                            setSettings(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    name: e
                                                                        .target
                                                                        .value,
                                                                })
                                                            )
                                                        }
                                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                                        Email Address
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={settings.email}
                                                        disabled
                                                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-gray-400 cursor-not-allowed"
                                                    />
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Email cannot be changed
                                                    </p>
                                                </div>

                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                                        <FaMapMarkerAlt className="inline mr-2" />
                                                        Address
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={settings.address}
                                                        onChange={(e) =>
                                                            setSettings(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    address:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            )
                                                        }
                                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                    />
                                                </div>
                                            </div>

                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleSaveProfile}
                                                disabled={saving}
                                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                                            >
                                                {saving ? (
                                                    <>
                                                        <LoadingSpinner size="sm" />
                                                        <span>Saving...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaSave />
                                                        <span>
                                                            Save Changes
                                                        </span>
                                                    </>
                                                )}
                                            </motion.button>
                                        </motion.div>
                                    )}

                                    {/* Security Section */}
                                    {activeSection === "security" && (
                                        <motion.div
                                            key="security"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="space-y-6"
                                        >
                                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                                                <FaShield className="mr-3" />
                                                Security Settings
                                            </h2>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                                        Current Password
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type={
                                                                showCurrentPassword
                                                                    ? "text"
                                                                    : "password"
                                                            }
                                                            value={
                                                                passwordData.currentPassword
                                                            }
                                                            onChange={(e) =>
                                                                setPasswordData(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        currentPassword:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    })
                                                                )
                                                            }
                                                            className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                            placeholder="Enter current password"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setShowCurrentPassword(
                                                                    !showCurrentPassword
                                                                )
                                                            }
                                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                                                        >
                                                            {showCurrentPassword ? (
                                                                <FaEyeSlash />
                                                            ) : (
                                                                <FaEye />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                                        New Password
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type={
                                                                showNewPassword
                                                                    ? "text"
                                                                    : "password"
                                                            }
                                                            value={
                                                                passwordData.newPassword
                                                            }
                                                            onChange={(e) =>
                                                                setPasswordData(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        newPassword:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    })
                                                                )
                                                            }
                                                            className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                            placeholder="Enter new password"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setShowNewPassword(
                                                                    !showNewPassword
                                                                )
                                                            }
                                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                                                        >
                                                            {showNewPassword ? (
                                                                <FaEyeSlash />
                                                            ) : (
                                                                <FaEye />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                                        Confirm New Password
                                                    </label>
                                                    <input
                                                        type="password"
                                                        value={
                                                            passwordData.confirmPassword
                                                        }
                                                        onChange={(e) =>
                                                            setPasswordData(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    confirmPassword:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            )
                                                        }
                                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                        placeholder="Confirm new password"
                                                    />
                                                </div>
                                            </div>

                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleChangePassword}
                                                disabled={
                                                    saving ||
                                                    !passwordData.currentPassword ||
                                                    !passwordData.newPassword ||
                                                    !passwordData.confirmPassword
                                                }
                                                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                                            >
                                                {saving ? (
                                                    <>
                                                        <LoadingSpinner size="sm" />
                                                        <span>Changing...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaLock />
                                                        <span>
                                                            Change Password
                                                        </span>
                                                    </>
                                                )}
                                            </motion.button>
                                        </motion.div>
                                    )}

                                    {/* Other sections can be added here */}
                                    {activeSection === "notifications" && (
                                        <motion.div
                                            key="notifications"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="space-y-6"
                                        >
                                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                                                <FaBell className="mr-3" />
                                                Notification Preferences
                                            </h2>
                                            <p className="text-gray-300">
                                                Coming soon - Customize your
                                                notification settings
                                            </p>
                                        </motion.div>
                                    )}

                                    {activeSection === "privacy" && (
                                        <motion.div
                                            key="privacy"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="space-y-6"
                                        >
                                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                                                <FaLock className="mr-3" />
                                                Privacy Settings
                                            </h2>
                                            <p className="text-gray-300">
                                                Coming soon - Manage your
                                                privacy preferences
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
