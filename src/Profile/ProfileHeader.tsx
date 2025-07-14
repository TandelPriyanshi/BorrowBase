import { useEffect, useState } from "react";

interface ResourceCounts {
  borrowCount: number;
  lendCount: number;
  exchangeCount: number;
}

interface LendItem {
  id: number;
  title: string;
  description: string;
}

interface UserProfile {
  name: string;
  profile_pic_url: string;
  counts?: ResourceCounts;
  lendItems?: LendItem[];
}

const ProfileHeader = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/profile", {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Unauthorized or failed request");

        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("Failed to fetch user profile", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("photo", file);

    try {
      const res = await fetch("http://localhost:3000/api/profile/upload-profile-pic", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();
      if (data.path) {
        setUser((prev) =>
          prev ? { ...prev, profile_pic_url: data.path } : prev
        );
      }
    } catch (err) {
      console.error("Upload error", err);
    }
  };

  if (loading) return <p className="text-black">Loading profile...</p>;
  if (!user) return <p className="text-red-400">You are not logged in.</p>;

  const { borrowCount = 0, lendCount = 0, exchangeCount = 0 } = user.counts || {};

  return (
    <div className="mb-6">
      <div className="flex items-center gap-8">
        {/* Profile Image */}
        <div className="w-32 h-32 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center relative group">
          {user.profile_pic_url ? (
            <img
              src={`http://localhost:3000/${user.profile_pic_url}`}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <label className="cursor-pointer text-5xl text-gray-400 hover:text-white transition duration-200">
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileUpload}
                className="hidden"
              />
              +
            </label>
          )}
        </div>

        {/* User Info */}
        <div>
          <h2 className="text-2xl font-semibold">{user.name}</h2>
          <div className="flex gap-8 text-sm mt-2">
            <span>
              <strong>{borrowCount}</strong> Borrow
            </span>
            <span>
              <strong>{lendCount}</strong> Lend
            </span>
            <span>
              <strong>{exchangeCount}</strong> Exchange
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
