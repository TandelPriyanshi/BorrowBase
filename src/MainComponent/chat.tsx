// src/pages/ChatPage.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import socket from "../socket";
import ChatList from "../Component/chatList";
import ChatWindow from "../Component/chatWindow";

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

  // Fetch user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/profile", {
          withCredentials: true,
        });
        setUserId(res.data.id);
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };
    fetchUser();
  }, []);

  // Fetch chat list
  useEffect(() => {
    if (userId !== null) {
      axios
        .get(`http://localhost:3000/api/chat/${userId}`, {
          withCredentials: true,
        })
        .then((res) => setChats(res.data))
        .catch((err) => console.error("Failed to fetch chats", err));
    }
  }, [userId]);

  // Fetch messages for active chat
  useEffect(() => {
    if (activeChat) {
      socket.emit("join_room", activeChat.id);

      axios
        .get(`http://localhost:3000/api/messages/${activeChat.id}`, {
          withCredentials: true,
        })
        .then((res) => {
          const mapped = res.data.map((msg: any) => ({
            id: msg.id,
            chat_id: msg.chat_id,
            sender_id: msg.sender_id,
            content: msg.message,
            timestamp: msg.sent_at,
          }));
          setMessages(mapped);
        })
        .catch((err) => console.error("Failed to fetch messages", err));
    }
  }, [activeChat]);

  // Socket receive handler — ONLY for messages sent by other users
  useEffect(() => {
    const handleReceive = (msg: any) => {
      if (msg.chat_id === activeChat?.id && msg.sender_id !== userId) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("receive_message", handleReceive);

    return () => {
      socket.off("receive_message", handleReceive);
    };
  }, [activeChat, userId]);

  // Send message handler
  const handleSendMessage = async (msg: string) => {
    if (!activeChat || !userId) return;

    const messageData = {
      chat_id: activeChat.id,
      sender_id: userId,
      content: msg,
    };

    try {
      // Emit for receiver
      socket.emit("send_message", messageData);

      // Store in DB
      const res = await axios.post("http://localhost:3000/api/messages", messageData, {
        withCredentials: true,
      });

      setMessages((prev) => [...prev, {
        id: res.data.id,
        chat_id: res.data.chat_id,
        sender_id: res.data.sender_id,
        content: res.data.message,
        timestamp: res.data.sent_at,
      }]);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  if (userId === null) {
    return <div className="text-white p-4">Loading user...</div>;
  }

  return (
    <div className="flex h-full">
      <ChatList
        chats={chats}
        onSelectChat={setActiveChat}
        currentUserId={userId}
      />
      <ChatWindow
        chat={activeChat}
        messages={messages}
        userId={userId}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default ChatPage;
