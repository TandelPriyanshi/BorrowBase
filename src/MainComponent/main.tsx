import { useEffect, useState } from "react";
import Card from "../Component/card";
import GetLocation from "../Location/GetLocation";

interface MainProps {
  isCollapsed: boolean;
}

interface Resource {
  id: number;
  title: string;
  description: string;
  type: string;
  photos: string[];
  owner_id: number;
  owner_name: string;
  owner_latitude?: number;
  owner_longitude?: number;
  owner_address?: string;
}

interface UserProfile {
  id: number;
  latitude: number;
  longitude: number;
}

const Main: React.FC<MainProps> = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [userLocation, setUserLocation] = useState<UserProfile | null>(null);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/profile", {
        credentials: "include",
      });
      const data = await res.json();
      setUserLocation({
        id: data.id,
        latitude: data.latitude,
        longitude: data.longitude,
      });
    } catch (err) {
      console.error("Failed to fetch user profile", err);
    }
  };

  const fetchResources = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/resources/others", {
        credentials: "include",
      });
      const data = await res.json();
      setResources(data);
    } catch (err) {
      console.error("Failed to fetch resources", err);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchResources();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-2 m-2">
      <GetLocation />
      {resources.map((res) => (
        <Card
          key={res.id}
          resource_id={res.id}
          title={res.title}
          description={res.description}
          type={res.type}
          photo={res.photos[0]}
          owner_id={res.owner_id}
          owner_name={res.owner_name}
          owner_latitude={res.owner_latitude}
          owner_longitude={res.owner_longitude}
          owner_address={res.owner_address}
          current_user_id={userLocation?.id || 0}
          current_latitude={userLocation?.latitude}
          current_longitude={userLocation?.longitude}
        />
      ))}
    </div>
  );
};

export default Main;
