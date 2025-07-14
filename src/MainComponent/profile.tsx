import { useState } from "react";
import ProfileHeader from "../Profile/ProfileHeader";
import ProfileTabs from "../Profile/ProfileTabs";
import ProfileContent from "../Profile/ProfileContent";

const Profile = () => {
  const [activeTab, setActiveTab] = useState("Borrow");

  return (
    <div className="flex text-black min-h-screen">
      {/* Sidebar stays as-is from your layout */}

      {/* Main Profile Area */}
      <div className="flex-1 px-6 py-8">
        <ProfileHeader />
        <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        <ProfileContent activeTab={activeTab} />
      </div>
    </div>
  );
};

export default Profile;
