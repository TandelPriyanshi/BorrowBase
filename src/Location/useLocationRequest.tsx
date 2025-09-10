import { useCallback } from "react";
import { reverseGeocode } from "./reverseGeocode";
import { updateLocationAPI } from "./updateLocationAPI";

export const useLocationRequest = () => {
  const requestLocationPermission = useCallback(async (showDialog = true): Promise<boolean> => {
    // Check if location is already saved
    const hasLocation = sessionStorage.getItem("locationSaved");
    if (hasLocation === "true") return true;

    let allow = true;
    if (showDialog) {
      allow = window.confirm(
        "Welcome! We use your location to suggest nearby resources and improve your experience. Do you want to allow location access?"
      );
    }

    if (!allow) {
      // Mark as asked but declined to avoid repeated prompts
      sessionStorage.setItem("locationAsked", "true");
      return false;
    }

    return new Promise((resolve) => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            try {
              const address = await reverseGeocode(lat, lon);
              await updateLocationAPI(lat, lon, address);
              sessionStorage.setItem("locationSaved", "true");
              // Remove the declined flag if location was successfully saved
              sessionStorage.removeItem("locationAsked");
              resolve(true);
            } catch (error) {
              console.error("Location update failed:", error);
              resolve(false);
            }
          },
          (err) => {
            console.error("Geolocation error:", err);
            resolve(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 600000 // 10 minutes
          }
        );
      } else {
        resolve(false);
      }
    });
  }, []);

  const clearLocationData = useCallback(() => {
    sessionStorage.removeItem("locationSaved");
    sessionStorage.removeItem("locationAsked");
  }, []);

  return {
    requestLocationPermission,
    clearLocationData
  };
};
