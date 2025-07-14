import { useState, useEffect } from "react";
import { Camera } from "lucide-react";
import Button from "../Component/button";
import Modal from "../Component/modal";
import AddResourceForm from "./AddResourceForm";
import ProfileCard from "../Component/profileCard";

interface ResourceItem {
  id: number;
  title: string;
  description: string;
  photos: string[];
  type: string;
}

interface ProfileContentProps {
  activeTab: "Lend" | "Borrow" | "Exchange";
}

const ProfileContent = ({ activeTab }: ProfileContentProps) => {
  const [showModal, setShowModal] = useState(false);
  const [items, setItems] = useState<ResourceItem[]>([]);

  const handleAddClick = () => {
    if (activeTab !== "Borrow") setShowModal(true);
  };

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const url =
          activeTab === "Borrow"
            ? "http://localhost:3000/api/borrow/accepted"
            : "http://localhost:3000/api/resources/user";

        const res = await fetch(url, {
          credentials: "include",
        });
        const data = await res.json();

        const filtered =
          activeTab === "Borrow"
            ? data
            : data.filter(
                (item: ResourceItem) =>
                  item?.type?.toLowerCase?.() === activeTab?.toLowerCase?.()
              );

        setItems(filtered);
      } catch (err) {
        console.error("Failed to fetch resources", err);
      }
    };

    fetchItems();
  }, [activeTab, showModal]);

  const handleReturn = async (resourceId: number) => {
    try {
      const res = await fetch(
        `http://localhost:3000/api/borrow/${resourceId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: "returned" }),
        }
      );

      if (!res.ok) throw new Error("Failed to mark as returned");

      setItems((prev) => prev.filter((item) => item.id !== resourceId));
    } catch (error) {
      console.error("Return failed", error);
      alert("Something went wrong");
    }
  };

  return (
    <div className="mt-10 px-4">
      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <ProfileCard
              key={item.id}
              id={item.id}
              title={item.title}
              description={item.description}
              photo={item.photos?.[0]}
              showReturn={activeTab === "Borrow"}
              onReturn={() => handleReturn(item.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <Camera className="mx-auto mb-4 text-gray-500" size={48} />
          <h2 className="text-lg font-semibold">
            No {activeTab.toLowerCase()} items yet
          </h2>
          <p className="text-sm text-gray-400">
            Start adding your {activeTab.toLowerCase()} items here.
          </p>

          {activeTab !== "Borrow" && (
            <div className="mt-6 w-40 mx-auto">
              <Button
                buttonName={`Add ${activeTab}`}
                onClick={handleAddClick}
                type="button"
              />
            </div>
          )}
        </div>
      )}

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <AddResourceForm onClose={() => setShowModal(false)} />
        </Modal>
      )}
    </div>
  );
};

export default ProfileContent;
