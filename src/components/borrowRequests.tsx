import { useEffect, useState } from "react";
import api from "../utils/api";
import Button from "./button";
import { toast } from "react-toastify";
import { FaClock, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

interface BorrowRequest {
    id: number;
    resource_id: number;
    requester_id: number;
    message: string;
    status: string;
    resource: {
        id: number;
        title: string;
        owner_id: number;
        owner: {
            id: number;
            name: string;
        };
    };
    requester: {
        id: number;
        name: string;
    };
}

const BorrowRequests = () => {
    const [requests, setRequests] = useState<BorrowRequest[]>([]);
    const [userId, setUserId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);

    const fetchUser = async () => {
        try {
            const res = await api.get("/api/profile");
            const data = res.data.data || res.data;
            setUserId(data.id);
        } catch (err) {
            console.error("Failed to fetch user", err);
            toast.error("Failed to load user information");
        }
    };

    const fetchRequests = async () => {
        try {
            const res = await api.get("/api/resource-requests");
            const response = res.data;
            // Extract the data array from the API response
            const requestsArray = Array.isArray(response.data) ? response.data : [];
            setRequests(requestsArray);
        } catch (err) {
            console.error("Failed to fetch requests", err);
            toast.error("Failed to load borrow requests");
            setRequests([]); // Set empty array on error
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            await fetchUser();
            await fetchRequests();
        };
        loadData();
    }, []);

    const handleUpdate = async (
        id: number,
        status: "approved" | "rejected"
    ) => {
        setProcessingId(id);
        try {
            await api.put(`/api/borrow-requests/${id}/status`, { status });

            const actionText = status === "approved" ? "approved" : "rejected";
            toast.success(`Request ${actionText} successfully!`);

            // Remove the request from the list since it's no longer pending
            setRequests((prev) => prev.filter((req) => req.id !== id));
        } catch (err: any) {
            console.error("Failed to update request", err);
            const errorMessage =
                err?.response?.data?.message || "Something went wrong";
            toast.error(errorMessage);
        } finally {
            setProcessingId(null);
        }
    };

    const incomingRequests = requests.filter(
        (req) => req.status === "pending" && req.resource?.owner_id === userId
    );

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="text-gray-400">Loading borrow requests...</div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <FaClock className="text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">
                    Pending Requests
                </h3>
                <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full">
                    {incomingRequests.length}
                </span>
            </div>

            {incomingRequests.length === 0 && (
                <div className="text-center p-8 bg-gray-800 rounded-lg">
                    <FaClock className="text-gray-400 text-2xl mx-auto mb-2" />
                    <p className="text-gray-400">No pending borrow requests</p>
                </div>
            )}

            {incomingRequests.map((req) => (
                <div
                    key={req.id}
                    className="bg-gray-800 text-white p-6 rounded-lg shadow-lg border-l-4 border-yellow-400"
                >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <FaClock className="text-yellow-400" />
                                <p className="font-medium">
                                    <span className="font-semibold text-blue-400">
                                        {req.requester?.name || 'Unknown User'}
                                    </span>{" "}
                                    wants to borrow{" "}
                                    <span className="font-semibold text-green-400">
                                        {req.resource?.title || 'Unknown Item'}
                                    </span>
                                </p>
                            </div>
                            <p className="text-sm italic text-gray-300 mb-2 bg-gray-700 p-2 rounded">
                                "{req.message}"
                            </p>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-400">Status:</span>
                                <span className="text-yellow-400 font-medium capitalize">
                                    {req.status}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 sm:mt-0 sm:ml-6 flex gap-3">
                            <Button
                                buttonName={
                                    processingId === req.id
                                        ? "Approving..."
                                        : "Approve"
                                }
                                onClick={() => handleUpdate(req.id, "approved")}
                                type="button"
                                disabled={processingId === req.id}
                                className="bg-green-600 hover:bg-green-700 flex items-center gap-1"
                            />
                            <Button
                                buttonName={
                                    processingId === req.id
                                        ? "Rejecting..."
                                        : "Reject"
                                }
                                onClick={() => handleUpdate(req.id, "rejected")}
                                type="button"
                                disabled={processingId === req.id}
                                className="bg-red-600 hover:bg-red-700 flex items-center gap-1"
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default BorrowRequests;
