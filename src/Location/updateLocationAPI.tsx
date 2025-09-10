import ApiService from '../services/apiService';

export const updateLocationAPI = async (
  latitude: number,
  longitude: number,
  address: string
): Promise<void> => {
  console.log("📤 Sending location update to backend:", latitude, longitude, address); 
  
  try {
    await ApiService.updateLocation({
      latitude,
      longitude,
      address
    });
    
    console.log("✅ Location updated successfully");
  } catch (error: any) {
    console.error("❌ Location update failed:", error);
    throw new Error(error.response?.data?.message || "Location update failed");
  }
};
