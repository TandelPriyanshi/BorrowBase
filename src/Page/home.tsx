import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/navbar";
import Sidebar from "../components/sidebar";
import Footer from "../components/footer";
import Chat from "../MainComponent/chat";
import Profile from "../MainComponent/profile";
import Notification from "../MainComponent/notification";
import Main from "../MainComponent/main";

const Home: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();

  const renderMainContent = () => {
    switch (location.pathname) {
      case "/home":
        return <Main isCollapsed={isSidebarCollapsed} />;
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
        <Navbar />
      </div>

      <div className="flex flex-1">
        <div className="fixed top-[64px] left-0 h-[calc(100vh-64px)] z-40">
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
          />
        </div>

        <div
          className={`flex-1 transition-all duration-300 ${
            isSidebarCollapsed ? "ml-[70px]" : "ml-[250px]"
          }`}
        >
          {renderMainContent()}
        </div>
      </div>

      {shouldShowFooter && <Footer />}
    </div>
  );
};

export default Home;
