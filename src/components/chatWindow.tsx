import { useEffect, useRef } from "react";
import { BiSend } from "react-icons/bi";
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

const ChatWindow: React.FC<ChatWindowProps> = ({ chat, messages, userId, onSendMessage }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const message = inputRef.current?.value.trim();
    if (message) {
      onSendMessage(message);
      inputRef.current!.value = "";
    }
  };

  if (!chat) {
    return (
      <div className="flex-1 bg-gray-100 flex items-center justify-center text-gray-500 text-xl h-screen">
        Select a chat to start messaging
      </div>
    );
  }

  const otherUserName =
    chat.user1_id === userId ? chat.user2_name : chat.user1_name;

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh-64px)] ">
      {/* Chat Header */}
      <div className="p-4 border-b bg-white shadow text-xl font-semibold">
        {otherUserName}
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-100 space-y-2">
        {messages.map((msg) => {
          const isOwn = msg.sender_id === userId;
          return (
            <div
              key={msg.id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs sm:max-w-sm md:max-w-md px-4 py-2 rounded-2xl shadow ${
                  isOwn
                    ? "dark:bg-gray-800 text-white rounded-br-none"
                    : "bg-white text-gray-800 rounded-bl-none"
                }`}
              >
                <div className="text-sm">{msg.content}</div>
                <div className="text-[10px] mt-1 text-right opacity-60">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white flex gap-2">
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border rounded-lg"
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <IconButton
            icon={<BiSend />}
            ariaLabel="Send"
            onClick={() => handleSend}
            className="dark:bg-gray-800 dark:hover:bg-gray-700"
          />
      </div>
    </div>
  );
};

export default ChatWindow;
