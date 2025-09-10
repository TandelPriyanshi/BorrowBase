import React, { useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/navbar";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Chat from "../MainComponent/chat";
import Profile from "../MainComponent/profile";
import Notification from "../MainComponent/notification";
import Main from "../MainComponent/main";
import DebugPanel from "../components/DebugPanel";

const Home: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const location = useLocation();

  // Function to trigger refresh of resources
  const handleResourceAdded = () => {
    // Trigger refresh by incrementing the key
    setRefreshKey(prev => prev + 1);
  };

  const renderMainContent = () => {
    switch (location.pathname) {
      case "/home":
        return <Main isCollapsed={isSidebarCollapsed} refreshKey={refreshKey} />;
      case "/chat":
        return <Chat />;
      case `/chat/${location.pathname.split("/")[2]}`:
        return <Chat />;
      case "/profile":
        return <Profile />;
      case "/notification":
        return <Notification />;
      default:
        return <div className="p-5 text-xl">Page not found</div>;
    }
  };

  const shouldShowFooter = location.pathname !== "/chat";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="sticky top-0 z-50">
        <Navbar onResourceAdded={handleResourceAdded} />
      </div>

      <div className="flex flex-1">
        <div className="fixed top-[64px] left-0 h-[calc(100vh-64px)] z-40">
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
          />
        </div>

        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${
            isSidebarCollapsed ? "ml-[70px]" : "ml-[250px]"
          }`}
        >
          <div className="flex-1">
            {renderMainContent()}
          </div>
          {shouldShowFooter && <Footer />}
        </div>
      </div>
      {/* <DebugPanel /> */}
    </div>
  );
};

export default Home;
