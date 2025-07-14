import { useEffect, useRef } from "react";
import { reverseGeocode } from "./reverseGeocode";
import { updateLocationAPI } from "./updateLocationAPI";

const GetLocation: React.FC = () => {
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const hasLocation = sessionStorage.getItem("locationSaved");
    if (hasLocation === "true") return;

    const askPermissionAndFetch = async () => {
      const allow = window.confirm(
        "We use your location to suggest nearby resources. Do you want to allow location access?"
      );
      if (!allow) return;

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            try {
              const address = await reverseGeocode(lat, lon);
              await updateLocationAPI(lat, lon, address);
              sessionStorage.setItem("locationSaved", "true");
            } catch (error) {
              console.error("Location update failed:", error);
            }
          },
          (err) => {
            console.error("Geolocation error:", err);
          }
        );
      }
    };

    askPermissionAndFetch();
  }, []);

  return null;
};

export default GetLocation;
