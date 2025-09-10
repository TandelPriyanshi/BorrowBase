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
      className={`bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700 shadow-2xl h-full transition-all duration-300 ${
        isCollapsed ? "w-[70px]" : "w-[250px]"
      }`}
    >
      {/* Header with toggle button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">BB</span>
            </div>
            <span className="text-white font-semibold">Menu</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-200 cursor-pointer group"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu size={18} className="text-gray-300 group-hover:text-white" />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-2">
          {departments.map((dept) => {
            const isActive = location.pathname === dept.path;
            return (
              <li key={dept.path}>
                <Link
                  to={dept.path}
                  title={isCollapsed ? dept.name : undefined}
                  className={`group flex items-center px-3 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? "bg-blue-600 text-white shadow-lg" 
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <span className={`flex-shrink-0 ${
                    isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                  }`}>
                    {dept.icon}
                  </span>
                  {!isCollapsed && (
                    <span className={`ml-3 text-sm font-medium transition-colors duration-200 ${
                      isActive ? "text-white" : "text-gray-300 group-hover:text-white"
                    }`}>
                      {dept.name}
                    </span>
                  )}
                  {isActive && !isCollapsed && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="border-t border-gray-700 p-4">
          <div className="text-xs text-gray-400 text-center">
            <p>Borrow Base</p>
            <p className="mt-1">v1.0.0</p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
