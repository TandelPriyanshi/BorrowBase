export const updateLocationAPI = async (
  latitude: number,
  longitude: number,
  address: string
): Promise<void> => {
  console.log("📤 Sending location update to backend:", latitude, longitude, address); 
  const res = await fetch("http://localhost:3000/api/update-location", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ latitude, longitude, address }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error || "Location update failed");
  }
};
