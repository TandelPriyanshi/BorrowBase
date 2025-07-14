import React from "react";

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
}

const ChatList: React.FC<ChatListProps> = ({ chats, onSelectChat, currentUserId }) => {
  return (
    <div className="w-1/3 border-r border-gray-300 bg-white overflow-y-auto h-full">
      <h2 className="text-lg absolute fixed h-10 font-semibold p-4">Your Chats</h2>
      <div className="pt-15"></div>
      {chats.length === 0 && <p className="p-4 mt-20 text-gray-500">No chats yet</p>}

      {chats.map((chat) => {
        const otherUserName =
          chat.user1_id === currentUserId ? chat.user2_name : chat.user1_name;

        return (
          <div
            key={chat.id}
            className="p-4 cursor-pointer hover:bg-gray transition-all"
            onClick={() => onSelectChat(chat)}
          >
            {otherUserName}
          </div>
        );
      })}
    </div>
  );
};


export default ChatList;
