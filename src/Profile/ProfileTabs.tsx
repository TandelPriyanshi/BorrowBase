import { motion } from "framer-motion";
import {
    Grid,
    Repeat,
    Handshake,
    MessageSquare,
    Package,
    Clock,
} from "lucide-react";

// Ensure Tailwind includes these color classes
// text-blue-500 text-green-500 text-purple-500 text-orange-500 text-pink-500 text-indigo-500
// bg-gradient-to-r from-blue-500 to-blue-600 bg-gradient-to-r from-green-500 to-green-600
// bg-gradient-to-r from-purple-500 to-purple-600 bg-gradient-to-r from-orange-500 to-orange-600
// bg-gradient-to-r from-pink-500 to-pink-600 bg-gradient-to-r from-indigo-500 to-indigo-600

interface ProfileTabsProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const tabs = [
    { name: "Requested", icon: Clock, color: "blue", bgClass: "bg-gradient-to-r from-blue-500 to-blue-600", textClass: "text-blue-500" },
    { name: "Borrow", icon: Handshake, color: "green", bgClass: "bg-gradient-to-r from-green-500 to-green-600", textClass: "text-green-500" },
    { name: "Lend", icon: Repeat, color: "purple", bgClass: "bg-gradient-to-r from-purple-500 to-purple-600", textClass: "text-purple-500" },
    { name: "Exchange", icon: Package, color: "orange", bgClass: "bg-gradient-to-r from-orange-500 to-orange-600", textClass: "text-orange-500" },
    { name: "Items", icon: Grid, color: "pink", bgClass: "bg-gradient-to-r from-pink-500 to-pink-600", textClass: "text-pink-500" },
    { name: "Reviews", icon: MessageSquare, color: "indigo", bgClass: "bg-gradient-to-r from-indigo-500 to-indigo-600", textClass: "text-indigo-500" },
];

const ProfileTabs = ({ activeTab, setActiveTab }: ProfileTabsProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-2 mb-6"
        >
            <div className="flex justify-center">
                {tabs.map((tab, index) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.name;

                    return (
                        <motion.button
                            key={tab.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`flex flex-col items-center px-6 py-4 text-sm rounded-xl cursor-pointer transition-all duration-300 ${
                                isActive
                                    ? `${tab.bgClass} text-white shadow-lg`
                                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                            }`}
                            onClick={() => setActiveTab(tab.name)}
                        >
                            <Icon
                                size={24}
                                className={`mb-2 ${
                                    isActive
                                        ? "text-white"
                                        : tab.textClass
                                }`}
                            />
                            <span className="font-medium">{tab.name}</span>
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-full"
                                    initial={false}
                                    transition={{
                                        type: "spring",
                                        stiffness: 500,
                                        damping: 30,
                                    }}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </motion.div>
    );
};

export default ProfileTabs;
