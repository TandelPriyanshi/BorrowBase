import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  MessageCircle,
  UserCircle,
  Bell,
  Menu,
} from "lucide-react";

const departments = [
  { name: "Home", path: "/home", icon: <Home size={22} /> },
  { name: "Chats", path: "/chat", icon: <MessageCircle size={22} /> },
  { name: "Profile", path: "/profile", icon: <UserCircle size={22} /> },
  { name: "Notification", path: "/notification", icon: <Bell size={22} /> },
];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const location = useLocation();

  return (
    <aside
      className={`bg-gray-100 border-r shadow-md h-full transition-all duration-300 ${
        isCollapsed ? "w-[70px]" : "w-[250px]"
      }`}
    >
      <div className="flex justify-end p-3">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 bg-gray-300 rounded-full hover:bg-gray-400"
        >
          <Menu size={20} />
        </button>
      </div>

      <ul className="space-y-2 px-2">
        {departments.map((dept) => {
          const isActive = location.pathname === dept.path;
          return (
            <li key={dept.path}>
              <Link
                to={dept.path}
                title={dept.name}
                className={`flex items-center space-x-3 p-2 rounded-md hover:bg-gray-200 transition ${
                  isActive ? "bg-gray-200 font-semibold" : ""
                }`}
              >
                <span className="text-gray-700">{dept.icon}</span>
                {!isCollapsed && (
                  <span className="text-gray-800 text-base">{dept.name}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default Sidebar;
