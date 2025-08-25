import { Grid, Repeat, Handshake, MessageSquare } from "lucide-react";

interface ProfileTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const tabs = ["Borrow", "Lend", "Exchange", "Reviews"];

const ProfileTabs = ({ activeTab, setActiveTab }: ProfileTabsProps) => {
  return (
    <div className="flex justify-center border-t border-gray-700 mb-6">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`flex flex-col items-center px-6 py-3 text-sm border-b-2 ${
            activeTab === tab ? "border-black text-black" : "border-transparent text-gray-400"
          }`}
          onClick={() => setActiveTab(tab)}
        >
          {tab === "Borrow" && <Grid size={20} />}
          {tab === "Lend" && <Handshake size={20} />}
          {tab === "Exchange" && <Repeat size={20} />}
          {tab === "Reviews" && <MessageSquare size={20} />}
          <span className="mt-1">{tab}</span>
        </button>
      ))}
    </div>
  );
};

export default ProfileTabs;

