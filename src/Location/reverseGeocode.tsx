// src/Location/reverseGeocode.ts
export const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
    {
      headers: {
        "User-Agent": "BorrowBase/1.0 (youremail@example.com)",
      },
    }
  );
  const data = await response.json();
  return data.display_name || "Unknown location";
};
