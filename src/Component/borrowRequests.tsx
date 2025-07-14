import { useEffect, useState } from "react";
import axios from "axios";
import Button from "./button";

interface BorrowRequest {
  id: number;
  resource_title: string;
  message: string;
  borrower_name: string;
  status: string;
  owner_id: number;
  borrower_id: number;
}

const BorrowRequests = () => {
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [userId, setUserId] = useState<number | null>(null);

  const fetchUser = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/borrow/me", {
        withCredentials: true,
      });
      setUserId(res.data.id);
    } catch (err) {
      console.error("Failed to fetch user", err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/borrow", {
        withCredentials: true,
      });
      setRequests(res.data);
    } catch (err) {
      console.error("Failed to fetch requests", err);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchRequests();
  }, []);

  const handleUpdate = async (id: number, status: "accepted" | "declined") => {
    try {
      const res = await axios.post(
        `http://localhost:3000/api/borrow/${id}`,
        { status },
        { withCredentials: true }
      );
      alert(res.data.message);
      fetchRequests();
    } catch (err: any) {
      console.error("Failed to update request", err);
      alert(err?.response?.data?.error || "Something went wrong");
    }
  };

  const incomingRequests = requests.filter(
    (req) => req.status === "pending" && req.owner_id === userId
  );

  return (
    <div className="space-y-4">
      {incomingRequests.length === 0 && (
        <p className="text-gray-400">No new borrow requests</p>
      )}

      {incomingRequests.map((req) => (
        <div
          key={req.id}
          className="bg-gray-800 text-white p-4 rounded shadow flex flex-col sm:flex-row justify-between items-start sm:items-center"
        >
          <div>
            <p>
              <span className="font-semibold">{req.borrower_name}</span> wants to
              borrow <span className="font-semibold">{req.resource_title}</span>
            </p>
            <p className="text-sm italic text-gray-400 mt-1">"{req.message}"</p>
            <p className="text-sm mt-1">
              Status: <span className="text-yellow-400">{req.status}</span>
            </p>
          </div>

          <div className="mt-3 sm:mt-0 sm:ml-4 flex gap-2">
            <Button
              buttonName="Accept"
              onClick={() => handleUpdate(req.id, "accepted")}
              type="button"
            />
            <Button
              buttonName="Reject"
              onClick={() => handleUpdate(req.id, "declined")}
              type="button"
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default BorrowRequests;
