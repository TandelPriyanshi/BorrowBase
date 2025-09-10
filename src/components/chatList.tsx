import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaUsers, FaComments } from "react-icons/fa";
import LoadingSpinner from "./ui/LoadingSpinner";
import EmptyState from "./ui/EmptyState";

interface Chat {
    id: number;
    user1_id: number;
    user2_id: number;
    user1_name: string;
    user2_name: string;
}

interface ChatListProps {
    chats: Chat[];
    onSelectChat: (chat: Chat) => void;
    currentUserId: number;
    isLoading?: boolean;
}

const ChatList: React.FC<ChatListProps> = ({
    chats,
    onSelectChat,
    currentUserId,
    isLoading = false,
}) => {
    // Safety check: ensure chats is an array
    const safeChats = Array.isArray(chats) ? chats : [];

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="p-6 border-b border-white/10"
            >
                <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <FaComments className="text-white text-lg" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            Messages
                        </h2>
                        <p className="text-gray-300 text-sm">
                            {safeChats.length} conversations
                        </p>
                    </div>
                </div>

                {/* Search Bar */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative"
                >
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                </motion.div>
            </motion.div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                    {isLoading && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-12"
                        >
                            <LoadingSpinner size="md" className="mb-3" />
                            <p className="text-gray-300 text-sm">
                                Loading conversations...
                            </p>
                        </motion.div>
                    )}

                    {!isLoading && safeChats.length === 0 && (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="p-6"
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
                                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                        />
                                    </svg>
                                }
                                title="No Conversations"
                                description="Start chatting by messaging someone from their profile or resource listing."
                                className="text-center"
                            />
                        </motion.div>
                    )}

                    {!isLoading && safeChats.length > 0 && (
                        <motion.div
                            key="chats"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="divide-y divide-white/10"
                        >
                            {safeChats.map((chat, index) => {
                                const otherUserName =
                                    chat.otherUserName ||
                                    (chat.user1_id === currentUserId
                                        ? chat.user2_name
                                        : chat.user1_name);
                                const lastMessage =
                                    chat.lastMessage?.content ||
                                    chat.last_message;
                                const lastAt =
                                    chat.lastMessage?.created_at ||
                                    chat.last_message_at;

                                return (
                                    <motion.div
                                        key={chat.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        whileHover={{
                                            x: 4,
                                            backgroundColor:
                                                "rgba(255,255,255,0.05)",
                                        }}
                                        onClick={() => onSelectChat(chat)}
                                        className="p-4 cursor-pointer transition-all duration-200 relative group"
                                    >
                                        <div className="flex items-center space-x-4">
                                            {/* Avatar */}
                                            <div className="relative">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform duration-200">
                                                    {otherUserName
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-gray-900 rounded-full"></div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className="font-semibold text-white truncate group-hover:text-blue-300 transition-colors duration-200">
                                                        {otherUserName}
                                                    </h3>
                                                    {lastAt && (
                                                        <span className="text-xs text-gray-400 flex-shrink-0">
                                                            {new Date(
                                                                lastAt
                                                            ).toLocaleTimeString(
                                                                [],
                                                                {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                }
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                                {lastMessage && (
                                                    <p className="text-sm text-gray-300 truncate">
                                                        {lastMessage}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Hover indicator */}
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-600 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-center rounded-r"></div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ChatList;
