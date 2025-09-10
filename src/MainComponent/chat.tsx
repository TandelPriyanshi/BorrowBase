// src/pages/ChatPage.tsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../utils/api";
import socket from "../socket";
import ChatList from "../components/chatList";
import ChatWindow from "../components/chatWindow";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";

interface Chat {
    id: number;
    user1_id: number;
    user2_id: number;
    user1_name: string;
    user2_name: string;
}

interface Message {
    id: number;
    chat_id: number;
    sender_id: number;
    content: string;
    timestamp: string;
}

const ChatPage = () => {
    const [userId, setUserId] = useState<number | null>(null);
    const [chats, setChats] = useState<Chat[]>([]);
    const [activeChat, setActiveChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoadingUser, setIsLoadingUser] = useState(true);
    const [isLoadingChats, setIsLoadingChats] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch user
    useEffect(() => {
        const fetchUser = async () => {
            try {
                setIsLoadingUser(true);
                const res = await api.get("/api/profile");

                // Handle different response formats
                const userData = res.data.data || res.data;
                const id = userData.id;

                if (id) {
                    setUserId(id);
                } else {
                    setError("No user ID found in profile response");
                    console.error(
                        "No user ID found in profile response:",
                        userData
                    );
                }
            } catch (err) {
                setError("Failed to load user profile");
                console.error("Failed to fetch user", err);
            } finally {
                setIsLoadingUser(false);
            }
        };
        fetchUser();
    }, []);

    // Fetch chat list
    useEffect(() => {
        if (userId !== null && userId !== undefined) {
            const fetchChats = async () => {
                try {
                    setIsLoadingChats(true);
                    const res = await api.get(`/api/chats/`);
                    console.log("Chats API Response:", res.data);

                    // Ensure we always set an array
                    let chatsData = res.data;
                    let processedChats: any[] = [];

                    if (Array.isArray(chatsData)) {
                        console.log(
                            "Setting chats as direct array:",
                            chatsData
                        );
                        processedChats = chatsData;
                    } else if (chatsData && Array.isArray(chatsData.chats)) {
                        // Handle nested structure like { chats: [...] }
                        console.log(
                            "Setting chats from nested chats:",
                            chatsData.chats
                        );
                        processedChats = chatsData.chats;
                    } else if (chatsData && Array.isArray(chatsData.data)) {
                        // Handle nested structure like { data: [...] }
                        console.log(
                            "Setting chats from nested data:",
                            chatsData.data
                        );
                        processedChats = chatsData.data;
                    } else {
                        console.warn("Unexpected chat data format:", chatsData);
                        processedChats = [];
                    }

                    // Process chats to get real user names
                    const chatsWithNames = processedChats.map((chat: any) => {
                        // The API returns otherUser.name, so we need to map it correctly
                        const otherUser = chat.otherUser || {};
                        const otherUserName =
                            otherUser.name ||
                            `User ${
                                chat.user1_id === userId
                                    ? chat.user2_id
                                    : chat.user1_id
                            }`;

                        const processedChat = {
                            ...chat,
                            user1_name:
                                chat.user1_id === userId
                                    ? "You"
                                    : otherUserName,
                            user2_name:
                                chat.user2_id === userId
                                    ? "You"
                                    : otherUserName,
                            otherUserName: otherUserName,
                        };

                        console.log(
                            "Processed chat with names:",
                            processedChat
                        );
                        return processedChat;
                    });

                    setChats(chatsWithNames);
                } catch (err) {
                    console.error("Failed to fetch chats", err);
                    setError("Failed to load chats");
                    setChats([]); // Ensure chats is always an array even on error
                } finally {
                    setIsLoadingChats(false);
                }
            };

            fetchChats();
        }
    }, [userId]);

    // Auto-select first chat when chats are loaded and no active chat is selected
    useEffect(() => {
        if (chats.length > 0 && !activeChat) {
            console.log("Auto-selecting first chat:", chats[0]);
            setActiveChat(chats[0]);
        }
    }, [chats, activeChat]);

    // Fetch messages for active chat
    useEffect(() => {
        if (activeChat) {
            socket.emit("join_chat", activeChat.id);

            api.get(`/api/chats/${activeChat.id}/messages`)
                .then((res) => {
                    const messagesData = res.data.data || res.data;
                    if (Array.isArray(messagesData)) {
                        const mapped = messagesData.map((msg: any) => ({
                            id: msg.id,
                            chat_id: msg.chat_id,
                            sender_id: msg.sender_id,
                            content: msg.content,
                            timestamp: msg.created_at || msg.timestamp,
                        }));
                        setMessages(mapped);
                    } else {
                        console.warn(
                            "Messages data is not an array:",
                            messagesData
                        );
                        setMessages([]);
                    }
                })
                .catch((err) => {
                    console.error("Failed to fetch messages", err);
                    setMessages([]); // Ensure messages is always an array
                });
        }
    }, [activeChat]);

    // Socket receive handler — ONLY for messages sent by other users
    useEffect(() => {
        const handleReceive = (msg: any) => {
            console.log("Received Socket.IO message:", msg);
            if (msg.chat_id === activeChat?.id && msg.sender_id !== userId) {
                // Map the Socket.IO message format to match frontend expectations
                const mappedMessage = {
                    id: msg.id,
                    chat_id: msg.chat_id,
                    sender_id: msg.sender_id,
                    content: msg.content,
                    timestamp: msg.created_at || msg.timestamp, // Handle both formats
                };
                console.log("Mapped message:", mappedMessage);
                setMessages((prev) => [...prev, mappedMessage]);
            }
        };

        socket.on("new_message", handleReceive);

        return () => {
            socket.off("new_message", handleReceive);
        };
    }, [activeChat, userId]);

    // Send message handler
    const handleSendMessage = async (msg: string) => {
        if (!activeChat || !userId) return;

        const messageData = {
            content: msg,
        };

        try {
            // Store in DB first
            const res = await api.post(
                `/api/chats/${activeChat.id}/messages`,
                messageData
            );
            const messageResponse = res.data.data || res.data;

            // Add to local state immediately
            const newMessage = {
                id: messageResponse.id,
                chat_id: messageResponse.chat_id,
                sender_id: messageResponse.sender_id,
                content: messageResponse.content,
                timestamp: messageResponse.created_at,
            };

            setMessages((prev) => [...prev, newMessage]);

            // Note: No need to emit socket event here as the backend ChatController
            // already emits the message to other users when the API call completes
        } catch (err) {
            console.error("Failed to send message:", err);
        }
    };

    const handleRetry = () => {
        setError(null);
        if (userId) {
            // Retry loading chats
            setIsLoadingChats(true);
        } else {
            // Retry loading user
            setIsLoadingUser(true);
        }
    };

    // Loading state
    if (isLoadingUser) {
        return (
            <div className="h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <LoadingSpinner size="lg" className="mb-4 mx-auto" />
                    <p className="text-gray-300 text-lg">
                        Loading your profile...
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                        Please wait while we set up your chat
                    </p>
                </motion.div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
                <ErrorState
                    title="Chat Error"
                    message={error}
                    onRetry={handleRetry}
                    className="max-w-md"
                />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex overflow-hidden"
        >
            {/* Chat Sidebar */}
            <motion.div
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full md:w-96 flex-shrink-0 bg-white/5 backdrop-blur-lg border-r border-white/10"
            >
                <ChatList
                    chats={chats}
                    onSelectChat={setActiveChat}
                    currentUserId={userId!}
                    isLoading={isLoadingChats}
                />
            </motion.div>

            {/* Chat Window */}
            <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex-1 flex flex-col bg-white/5 backdrop-blur-lg"
            >
                {activeChat ? (
                    <ChatWindow
                        chat={activeChat}
                        messages={messages}
                        userId={userId!}
                        onSendMessage={handleSendMessage}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center">
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
                            title="No Chat Selected"
                            description="Select a conversation from the sidebar to start chatting, or create a new conversation from a resource listing."
                        />
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default ChatPage;
