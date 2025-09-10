import { useEffect, useRef } from "react";
import { reverseGeocode } from "./reverseGeocode";
import { updateLocationAPI } from "./updateLocationAPI";
import { useAuth } from "../Auth/authContext";

interface GetLocationProps {
  forceRequest?: boolean; // Optional prop to force location request
}

const GetLocation: React.FC<GetLocationProps> = ({ forceRequest = false }) => {
  const hasRunRef = useRef(false);
  const { isAuthenticated, user, loading } = useAuth();

  useEffect(() => {
    // Don't run if auth is still loading
    if (loading) return;
    
    // Only ask for location if user is authenticated, unless forced
    if (!forceRequest && !isAuthenticated) return;
    
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const hasLocation = sessionStorage.getItem("locationSaved");
    if (hasLocation === "true") return;

    // Additional check: if user already has location in profile, don't ask again
    if (user?.latitude && user?.longitude && !forceRequest) {
      sessionStorage.setItem("locationSaved", "true");
      return;
    }

    const askPermissionAndFetch = async () => {
      const allow = window.confirm(
        "We use your location to suggest nearby resources. Do you want to allow location access?"
      );
      if (!allow) {
        // Mark as asked but declined to avoid repeated prompts
        sessionStorage.setItem("locationAsked", "true");
        return;
      }

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

    // Don't ask again if user previously declined
    const hasAsked = sessionStorage.getItem("locationAsked");
    if (hasAsked === "true" && !forceRequest) return;

    askPermissionAndFetch();
  }, [isAuthenticated, user, loading, forceRequest]);

  return null;
};

export default GetLocation;
