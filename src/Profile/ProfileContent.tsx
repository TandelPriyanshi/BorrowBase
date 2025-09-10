import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, AlertCircle } from "lucide-react";
import Modal from "../components/modal";
import AddResourceForm from "./AddResourceForm";
import ProfileCard from "../components/profileCard";
import type { ProfileCardProps } from "../components/profileCard";
import ProfileReviews from "./ProfileReviews";
import ApiService from "../services/apiService";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";

// --- TYPE DEFINITIONS ---
interface ResourceItem {
    id: number;
    title: string;
    description: string;
    photos: { photo_url: string }[];
    type: string;
    owner?: { name: string };
}

interface BorrowRequest {
    id: number;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    requested_at: string;
    resource: ResourceItem;
}

interface ActiveBorrowItem extends ResourceItem {
    borrow_id: number;
    status: 'approved' | 'active';
}

type DisplayItem = ResourceItem | BorrowRequest | ActiveBorrowItem;

interface ProfileData {
    borrowHistory: ActiveBorrowItem[];
    resources: {
        lend: ResourceItem[];
        exchange: ResourceItem[];
    };
    reviews: any[];
}

interface ProfileContentProps {
    activeTab:
        | "Requested"
        | "Borrow"
        | "Lend"
        | "Exchange"
        | "Items"
        | "Reviews";
    profileData: ProfileData | null;
}

// --- TYPE GUARDS ---
const isBorrowRequest = (item: DisplayItem): item is BorrowRequest => {
    return 'resource' in item && 'requested_at' in item;
};

const isActiveBorrow = (item: DisplayItem): item is ActiveBorrowItem => {
    return 'borrow_id' in item && !('resource' in item);
};


const ProfileContent = ({ activeTab, profileData }: ProfileContentProps) => {
    const [showModal, setShowModal] = useState(false);
    const [items, setItems] = useState<DisplayItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAddClick = () => {
        if (activeTab !== "Borrow" && activeTab !== "Requested")
            setShowModal(true);
    };
    
    // FIX: Wrapped fetchData in useCallback to stabilize the function
    // This prevents re-creation on every render and satisfies the exhaustive-deps linting rule.
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let data: DisplayItem[] = [];
            switch (activeTab) {
                case "Requested":
                    const response = await ApiService.getMyRequests();
                    const requests: BorrowRequest[] = response.data || response || [];
                    data = requests.filter(req => req.status === "pending");
                    break;
                case "Items":
                    const resResponse = await ApiService.getMyResources();
                    data = resResponse.data || resResponse || [];
                    break;
                case "Borrow":
                    if (profileData?.borrowHistory) {
                        data = profileData.borrowHistory.filter(
                            item => item.status === "approved" || item.status === "active"
                        );
                    }
                    break;
                case "Lend":
                    data = profileData?.resources?.lend || [];
                    break;
                case "Exchange":
                    data = profileData?.resources?.exchange || [];
                    break;
                default:
                    data = [];
            }
            setItems(data);
        } catch (err: any) {
            console.error(`Failed to fetch data for tab: ${activeTab}`, err);
            const errorMessage =
                err.response?.data?.message || `Failed to load your ${activeTab.toLowerCase()} items.`;
            setError(errorMessage);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [activeTab, profileData]); // Dependencies for useCallback

    // FIX: Added fetchData to the dependency array
    useEffect(() => {
        if (["Requested", "Items"].includes(activeTab) || profileData) {
            fetchData();
        } else {
            setItems([]);
        }
    }, [activeTab, profileData, fetchData]);

    // FIX: Added fetchData and activeTab to the dependency array
    useEffect(() => {
        if(!showModal) {
            if (["Items", "Lend", "Exchange"].includes(activeTab)) {
                fetchData();
            }
        }
    }, [showModal, activeTab, fetchData]);

    const handleCancelRequest = async (requestId: number) => {
        try {
            await ApiService.cancelBorrowRequest(requestId);
            setItems((prev) => prev.filter((item) => item.id !== requestId));
            alert("Borrow request cancelled successfully!");
        } catch (err: any) {
            console.error("Cancel request failed", err);
            const errorMessage = err.response?.data?.message || "Failed to cancel request";
            alert(errorMessage);
        }
    };

    const handleReturn = async (borrowId: number) => {
        try {
            const api = (await import("../utils/api")).default;
            await api.put(`/api/borrow/${borrowId}`, { status: "returned" });
            setItems((prev) => prev.filter((item) => !(isActiveBorrow(item) && item.borrow_id === borrowId)));
        } catch (error) {
            console.error("Return failed", error);
            const err = error as any;
            alert(err.response?.data?.message || "Something went wrong");
        }
    };
    
    // FIX: Fully implemented the getEmptyStateContent function
    const getEmptyStateContent = () => {
        switch (activeTab) {
            case "Requested":
                return { title: "No pending requests", description: "Your pending borrow requests will appear here." };
            case "Borrow":
                return { title: "No borrowed items yet", description: "Items you've borrowed will appear here." };
            case "Lend":
                return { title: "No items to lend", description: "Your listed items for lending will appear here." };
            case "Exchange":
                 return { title: "No items for exchange", description: "Your exchange items will appear here." };
            case "Items":
                 return { title: "You have no items", description: "All your resources will appear here." };
            default:
                return { title: "No items yet", description: "Your items will appear here." };
        }
    };
    
    if (activeTab === "Reviews") {
        // FIX: Added a null check for profileData before rendering
        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
               {profileData ? <ProfileReviews profileData={profileData} /> : <LoadingSpinner />}
            </motion.div>
        );
    }
    
    const { title: emptyTitle, description: emptyDescription } = getEmptyStateContent();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 min-h-[300px]"
        >
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div key="loading" className="flex flex-col items-center justify-center py-16">
                         <LoadingSpinner size="lg" />
                    </motion.div>
                ) : error ? (
                    <motion.div key="error">
                        <ErrorState
                            title={`Error Loading ${activeTab}`}
                            // FIX: Handled the possibility of error being null
                            message={error || "An unexpected error occurred."}
                            onRetry={fetchData}
                        >
                            <AlertCircle className="w-16 h-16 text-red-500" />
                        </ErrorState>
                    </motion.div>
                ) : items.length > 0 ? (
                    <motion.div key="items" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {items.map((item) => {
                            // FIX: Deconstructed props explicitly to ensure type safety for ProfileCard
                            const commonProps = {
                                title: isBorrowRequest(item) ? item.resource.title : item.title,
                                description: isBorrowRequest(item) ? item.resource.description : item.description,
                                photo: isBorrowRequest(item) ? item.resource.photos?.[0]?.photo_url : item.photos?.[0]?.photo_url,
                                ownerName: isBorrowRequest(item) ? item.resource.owner?.name : item.owner?.name,
                            };
                            
                            let specificProps: Omit<ProfileCardProps, 'title' | 'description' | 'photo' | 'ownerName'>;
                            if (isBorrowRequest(item)) {
                                specificProps = {
                                    id: item.id,
                                    status: item.status,
                                    requestDate: item.requested_at,
                                    showCancel: true,
                                    onCancel: () => handleCancelRequest(item.id),
                                };
                            } else if (isActiveBorrow(item)) {
                                specificProps = {
                                    id: item.borrow_id,
                                    status: item.status,
                                    requestDate: undefined,
                                    showReturn: true,
                                    showCancel: false,
                                    onReturn: () => handleReturn(item.borrow_id),
                                    onCancel: undefined
                                };
                            } else {
                                specificProps = { 
                                    id: item.id,
                                    status: undefined,
                                    requestDate: undefined,
                                    showReturn: false,
                                    showCancel: false,
                                    onReturn: undefined,
                                    onCancel: undefined
                                };
                            }

                            return (
                                <motion.div key={specificProps.id}>
                                    <ProfileCard {...commonProps} {...specificProps} />
                                </motion.div>
                            );
                        })}
                    </motion.div>
                ) : (
                   <motion.div key="empty">
                        <EmptyState
                            icon={<Camera className="w-16 h-16 text-gray-400" />}
                            title={emptyTitle}
                            description={emptyDescription}
                            action={
                                (activeTab === "Lend" || activeTab === "Exchange" || activeTab === "Items") ? {
                                    label: `Add ${activeTab === "Items" ? "New Item" : `${activeTab} Item`}`,
                                    onClick: handleAddClick
                                } : activeTab === "Borrow" ? {
                                    label: "Browse Items",
                                    onClick: () => (window.location.href = "/home")
                                } : undefined
                            }
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {showModal && (
                <Modal onClose={() => setShowModal(false)}>
                    <AddResourceForm onClose={() => setShowModal(false)} />
                </Modal>
            )}
        </motion.div>
    );
};

export default ProfileContent;