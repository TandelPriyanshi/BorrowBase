import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BiSend } from "react-icons/bi";
import { FaUser, FaPaperPlane, FaSmile } from "react-icons/fa";
import IconButton from "./icon_button";

interface Message {
    id: number;
    chat_id: number;
    sender_id: number;
    content: string;
    timestamp: string;
}

interface Chat {
    id: number;
    user1_id: number;
    user2_id: number;
    user1_name: string;
    user2_name: string;
}

interface ChatWindowProps {
    chat: Chat | null;
    messages: Message[];
    userId: number;
    onSendMessage: (msg: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
    chat,
    messages,
    userId,
    onSendMessage,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [inputValue, setInputValue] = useState("");

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        const message = inputValue.trim();
        if (message) {
            onSendMessage(message);
            setInputValue("");
            if (inputRef.current) {
                inputRef.current.value = "";
            }
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        // Simulate typing indicator logic here if needed
    };

    if (!chat) {
        return null; // This case is handled in the parent component now
    }

    const otherUserName =
        chat.otherUserName ||
        (chat.user1_id === userId ? chat.user2_name : chat.user1_name);

    const formatMessageTime = (timestamp: string) => {
        try {
            const date = new Date(timestamp);

            // Check if the date is valid
            if (isNaN(date.getTime())) {
                console.warn("Invalid timestamp received:", timestamp);
                return "Invalid Date";
            }

            const now = new Date();
            const diffDays = Math.floor(
                (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (diffDays === 0) {
                return date.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                });
            } else if (diffDays === 1) {
                return "Yesterday";
            } else {
                return date.toLocaleDateString();
            }
        } catch (error) {
            console.error("Error formatting timestamp:", timestamp, error);
            return "Invalid Date";
        }
    };

    const groupMessagesByDate = (messages: Message[]) => {
        const groups: { [key: string]: Message[] } = {};
        messages.forEach((msg) => {
            try {
                const date = new Date(msg.timestamp);
                if (isNaN(date.getTime())) {
                    console.warn(
                        "Invalid timestamp in groupMessagesByDate:",
                        msg.timestamp
                    );
                    return;
                }
                const dateString = date.toDateString();
                if (!groups[dateString]) groups[dateString] = [];
                groups[dateString].push(msg);
            } catch (error) {
                console.error(
                    "Error processing timestamp in groupMessagesByDate:",
                    msg.timestamp,
                    error
                );
            }
        });
        return groups;
    };

    const messageGroups = groupMessagesByDate(messages);

    return (
        <div className="flex flex-col h-full">
            {/* Chat Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="p-6 border-b border-white/10 bg-white/5 backdrop-blur-lg"
            >
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {otherUserName.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-gray-900 rounded-full"></div>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">
                            {otherUserName}
                        </h3>
                        <p className="text-sm text-gray-300">Active now</p>
                    </div>
                </div>
            </motion.div>

            {/* Messages Area */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-transparent to-white/5"
            >
                <AnimatePresence>
                    {Object.entries(messageGroups).map(
                        ([date, groupMessages]) => (
                            <div key={date} className="space-y-4">
                                {/* Date Separator */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex justify-center"
                                >
                                    <span className="px-4 py-2 bg-white/10 backdrop-blur-lg text-gray-300 text-xs font-medium rounded-full border border-white/20">
                                        {new Date(date).toLocaleDateString([], {
                                            weekday: "long",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </span>
                                </motion.div>

                                {/* Messages for this date */}
                                {groupMessages.map((msg, index) => {
                                    const isOwn = msg.sender_id === userId;
                                    const prevMsg = groupMessages[index - 1];
                                    const isGrouped =
                                        prevMsg &&
                                        prevMsg.sender_id === msg.sender_id;

                                    return (
                                        <motion.div
                                            key={msg.id}
                                            initial={{
                                                opacity: 0,
                                                y: 20,
                                                scale: 0.9,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                y: 0,
                                                scale: 1,
                                            }}
                                            transition={{ delay: index * 0.1 }}
                                            className={`flex ${
                                                isOwn
                                                    ? "justify-end"
                                                    : "justify-start"
                                            }`}
                                        >
                                            <div
                                                className={`flex items-end space-x-2 max-w-[70%] ${
                                                    isOwn
                                                        ? "flex-row-reverse space-x-reverse"
                                                        : ""
                                                }`}
                                            >
                                                {!isOwn && !isGrouped && (
                                                    <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-sm font-medium mb-1">
                                                        {otherUserName
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>
                                                )}
                                                {!isOwn && isGrouped && (
                                                    <div className="w-8" />
                                                )}

                                                <motion.div
                                                    whileHover={{ scale: 1.02 }}
                                                    className={`px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm border ${
                                                        isOwn
                                                            ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white border-blue-400/30 rounded-br-md"
                                                            : "bg-white/90 text-gray-800 border-white/30 rounded-bl-md"
                                                    } ${
                                                        isGrouped
                                                            ? "mt-1"
                                                            : "mt-3"
                                                    }`}
                                                >
                                                    <div className="text-sm leading-relaxed">
                                                        {msg.content}
                                                    </div>
                                                    <div
                                                        className={`text-xs mt-2 flex items-center ${
                                                            isOwn
                                                                ? "justify-end text-blue-100"
                                                                : "justify-end text-gray-500"
                                                        }`}
                                                    >
                                                        <span>
                                                            {formatMessageTime(
                                                                msg.timestamp
                                                            )}
                                                        </span>
                                                        {isOwn && (
                                                            <motion.div
                                                                initial={{
                                                                    scale: 0,
                                                                }}
                                                                animate={{
                                                                    scale: 1,
                                                                }}
                                                                transition={{
                                                                    delay: 0.2,
                                                                }}
                                                                className="ml-1 w-4 h-4 text-blue-200"
                                                            >
                                                                ✓✓
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )
                    )}
                </AnimatePresence>
                <div ref={bottomRef} />
            </div>

            {/* Typing Indicator */}
            <AnimatePresence>
                {isTyping && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="px-6 py-2 text-sm text-gray-300"
                    >
                        <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{
                                        duration: 0.6,
                                        repeat: Infinity,
                                        delay: 0,
                                    }}
                                    className="w-2 h-2 bg-gray-400 rounded-full"
                                />
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{
                                        duration: 0.6,
                                        repeat: Infinity,
                                        delay: 0.2,
                                    }}
                                    className="w-2 h-2 bg-gray-400 rounded-full"
                                />
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{
                                        duration: 0.6,
                                        repeat: Infinity,
                                        delay: 0.4,
                                    }}
                                    className="w-2 h-2 bg-gray-400 rounded-full"
                                />
                            </div>
                            <span>{otherUserName} is typing...</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Area */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="p-6 border-t border-white/10 bg-white/5 backdrop-blur-lg"
            >
                <div className="flex items-end space-x-4">
                    <div className="flex-1 relative">
                        <motion.input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={handleInputChange}
                            placeholder={`Message ${otherUserName}...`}
                            className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            whileFocus={{ scale: 1.01 }}
                        />
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                        >
                            <FaSmile />
                        </motion.button>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSend}
                        disabled={!inputValue.trim()}
                        className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 rounded-xl flex items-center justify-center text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                        <FaPaperPlane
                            className={`transition-transform duration-200 ${
                                inputValue.trim() ? "scale-100" : "scale-75"
                            }`}
                        />
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
};

export default ChatWindow;
