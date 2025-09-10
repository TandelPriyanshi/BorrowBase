import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Card from "../components/card";
import GetLocation from "../Location/GetLocation";
import ResourceFilter, { FilterOptions } from "../components/ResourceFilter";
import { FaPlus, FaSearch, FaMapMarkerAlt } from "react-icons/fa";
import ApiService from "../services/apiService";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorState from "../components/ui/ErrorState";
import EmptyState from "../components/ui/EmptyState";
import AnimationContainer from "../components/ui/AnimationContainer";
import { useResource, Resource } from "../contexts/ResourceContext";

interface MainProps {
    isCollapsed: boolean;
    refreshKey?: number;
}

// Remove duplicate interface - using the one from ResourceContext

interface UserProfile {
    id: number;
    latitude: number;
    longitude: number;
}

const Main: React.FC<MainProps> = ({ refreshKey: externalRefreshKey }) => {
    const [resources, setResources] = useState<Resource[]>([]);
    const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
    const [userLocation, setUserLocation] = useState<UserProfile | null>(null);
    const [internalRefreshKey, setInternalRefreshKey] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    const fetchUserProfile = async () => {
        try {
            const response = await ApiService.getProfile();
            const data = response.data || response;
            setUserLocation({
                id: data.id,
                latitude: data.latitude,
                longitude: data.longitude,
            });
            setCurrentUserId(data.id);
        } catch (err) {
            console.error("Failed to fetch user profile", err);
            setError("Failed to load user profile");
        }
    };

    const fetchResources = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await ApiService.getResources();
            const data = response.data || response;

            // Filter out user's own resources
            const filteredData = currentUserId
                ? data.filter(
                      (resource: Resource) =>
                          resource.owner_id !== currentUserId
                  )
                : data;

            setResources(filteredData);
            setFilteredResources(filteredData);
        } catch (err: any) {
            console.error("Failed to fetch resources", err);
            // Handle disabled resource endpoints gracefully
            if (
                err.response?.data?.message ===
                "Resource endpoints temporarily disabled"
            ) {
                setResources([]);
                setFilteredResources([]);
                setError("Resource management is temporarily disabled");
            } else {
                // Handle other errors
                setResources([]);
                setFilteredResources([]);
                setError("Failed to load resources. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Function to refresh resources
    const refreshResources = () => {
        setInternalRefreshKey((prev) => prev + 1);
        fetchResources();
    };

    const handleRetry = () => {
        setError(null);
        fetchResources();
    };

    // Function to calculate distance between two coordinates
    const getDistanceInKm = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ): number => {
        const toRad = (value: number) => (value * Math.PI) / 180;
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) *
                Math.cos(toRad(lat2)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Handle filter changes
    const handleFilterChange = (filters: FilterOptions) => {
        let filtered = [...resources];

        // Apply search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(
                (res) =>
                    res.title.toLowerCase().includes(searchLower) ||
                    res.description.toLowerCase().includes(searchLower) ||
                    (res.owner?.name || res.owner_name || "")
                        .toLowerCase()
                        .includes(searchLower) ||
                    res.category?.toLowerCase().includes(searchLower)
            );
        }

        // Apply type filter
        if (filters.type) {
            filtered = filtered.filter(
                (res) => res.type.toLowerCase() === filters.type.toLowerCase()
            );
        }

        // Apply category filter
        if (filters.category) {
            filtered = filtered.filter(
                (res) =>
                    res.category?.toLowerCase() ===
                    filters.category.toLowerCase()
            );
        }

        // Apply condition filter
        if (filters.condition) {
            filtered = filtered.filter((res) => {
                const resourceCondition = res.condition?.toLowerCase();
                const filterCondition = filters.condition.toLowerCase();

                // Map API condition values to filter values
                if (filterCondition === "new") {
                    return (
                        resourceCondition === "excellent" ||
                        resourceCondition === "new"
                    );
                } else if (filterCondition === "like new") {
                    return (
                        resourceCondition === "excellent" ||
                        resourceCondition === "like new"
                    );
                } else if (filterCondition === "good") {
                    return resourceCondition === "good";
                } else if (filterCondition === "fair") {
                    return resourceCondition === "fair";
                } else if (filterCondition === "poor") {
                    return resourceCondition === "poor";
                }

                return resourceCondition === filterCondition;
            });
        }

        // Apply availability filter
        if (filters.availability) {
            filtered = filtered.filter((res) => {
                if (filters.availability === "available now") {
                    return res.is_available === true && res.status === "active";
                } else if (filters.availability === "available soon") {
                    return (
                        res.is_available === false && res.status === "active"
                    );
                } else if (filters.availability === "currently borrowed") {
                    return res.status === "borrowed";
                }
                return true;
            });
        }

        // Apply price range filter
        if (filters.priceRange) {
            filtered = filtered.filter((res) => {
                const price = res.estimated_value || res.price || 0;
                return (
                    price >= filters.priceRange.min &&
                    price <= filters.priceRange.max
                );
            });
        }

        // Apply distance filter if user location is available
        if (userLocation && userLocation.latitude && userLocation.longitude) {
            filtered = filtered.filter((res) => {
                if (!res.owner_latitude || !res.owner_longitude) return true;
                const distance = getDistanceInKm(
                    userLocation.latitude,
                    userLocation.longitude,
                    res.owner_latitude,
                    res.owner_longitude
                );
                return distance <= filters.maxDistance;
            });

            // Apply sorting
            if (filters.sortBy === "distance") {
                filtered.sort((a, b) => {
                    if (!a.owner_latitude || !a.owner_longitude) return 1;
                    if (!b.owner_latitude || !b.owner_longitude) return -1;

                    const distA = getDistanceInKm(
                        userLocation.latitude,
                        userLocation.longitude,
                        a.owner_latitude,
                        a.owner_longitude
                    );
                    const distB = getDistanceInKm(
                        userLocation.latitude,
                        userLocation.longitude,
                        b.owner_latitude,
                        b.owner_longitude
                    );
                    return distA - distB;
                });
            }
        }

        // Apply other sorting options
        if (filters.sortBy === "rating") {
            filtered.sort(
                (a, b) => (b.average_rating || 0) - (a.average_rating || 0)
            );
        } else if (filters.sortBy === "recent") {
            // Sort by ID as a proxy for recent (assuming higher ID = more recent)
            filtered.sort((a, b) => b.id - a.id);
        } else if (filters.sortBy === "name") {
            filtered.sort((a, b) => a.title.localeCompare(b.title));
        } else if (filters.sortBy === "price_low") {
            filtered.sort(
                (a, b) =>
                    (a.estimated_value || a.price || 0) -
                    (b.estimated_value || b.price || 0)
            );
        } else if (filters.sortBy === "price_high") {
            filtered.sort(
                (a, b) =>
                    (b.estimated_value || b.price || 0) -
                    (a.estimated_value || a.price || 0)
            );
        }

        setFilteredResources(filtered);
    };

    useEffect(() => {
        fetchUserProfile();
    }, []);

    useEffect(() => {
        if (currentUserId !== null) {
            fetchResources();
        }
    }, [currentUserId, internalRefreshKey, externalRefreshKey]);

    // Update filtered resources when resources or user location changes
    useEffect(() => {
        setFilteredResources(resources);
    }, [resources]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
            {/* Hero Background */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

            <div className="relative z-10">
                <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
                    {/* Header Section */}
                    <AnimationContainer type="slide" className="mb-8">
                        <div className="text-center mb-8">
                            <motion.h1
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4"
                            >
                                Resource Exchange
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-lg text-gray-300 max-w-2xl mx-auto"
                            >
                                Discover and share resources in your community.
                                Build connections and reduce waste through smart
                                sharing.
                            </motion.p>
                        </div>

                        {/* Stats Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                <div className="flex items-center justify-center space-x-2">
                                    <FaSearch className="text-blue-400" />
                                    <div>
                                        <p className="text-2xl font-bold text-white">
                                            {filteredResources.length}
                                        </p>
                                        <p className="text-sm text-gray-300">
                                            Resources Found
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center space-x-2">
                                    <FaMapMarkerAlt className="text-green-400" />
                                    <div>
                                        <p className="text-2xl font-bold text-white">
                                            {userLocation ? "📍" : "❌"}
                                        </p>
                                        <p className="text-sm text-gray-300">
                                            Location{" "}
                                            {userLocation
                                                ? "Active"
                                                : "Inactive"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center space-x-2">
                                    <FaPlus className="text-purple-400" />
                                    <div>
                                        <p className="text-2xl font-bold text-white">
                                            {resources.length}
                                        </p>
                                        <p className="text-sm text-gray-300">
                                            Total Available
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Location Component */}
                        <div className="mb-6">
                            <GetLocation />
                        </div>
                    </AnimationContainer>

                    {/* Filters */}
                    <AnimationContainer
                        type="slide"
                        delay={0.4}
                        className="mb-8"
                    >
                        <ResourceFilter
                            onFilterChange={handleFilterChange}
                            isLoading={isLoading}
                            allResources={resources}
                        />
                    </AnimationContainer>

                    {/* Results Summary */}
                    {!isLoading && !error && (
                        <motion.div
                            className="mb-4 text-gray-400 text-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            Showing {filteredResources.length} of{" "}
                            {resources.length} resources
                            {filteredResources.length !== resources.length && (
                                <span className="ml-2 text-blue-400">
                                    (filtered)
                                </span>
                            )}
                        </motion.div>
                    )}

                    {/* Content Area */}
                    <AnimatePresence mode="wait">
                        {/* Loading State */}
                        {isLoading && (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-20"
                            >
                                <LoadingSpinner size="lg" className="mb-4" />
                                <p className="text-gray-300 text-lg">
                                    Loading amazing resources...
                                </p>
                                <p className="text-gray-400 text-sm mt-2">
                                    Please wait while we fetch the latest items
                                </p>
                            </motion.div>
                        )}

                        {/* Error State */}
                        {error && !isLoading && (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-white/5 backdrop-blur-lg rounded-2xl border border-red-500/20"
                            >
                                <ErrorState
                                    title="Oops! Something went wrong"
                                    message={error}
                                    onRetry={handleRetry}
                                    className="py-16"
                                />
                            </motion.div>
                        )}

                        {/* Empty State */}
                        {filteredResources.length === 0 &&
                            !isLoading &&
                            !error && (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10"
                                >
                                    <EmptyState
                                        icon={
                                            <svg
                                                className="w-full h-full"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1}
                                                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                                />
                                            </svg>
                                        }
                                        title="No Resources Found"
                                        description="We couldn't find any resources matching your criteria. Try adjusting your filters or check back later for new items."
                                        action={{
                                            label: "Refresh Resources",
                                            onClick: refreshResources,
                                        }}
                                        className="py-16"
                                    />
                                </motion.div>
                            )}

                        {/* Resource Grid */}
                        {filteredResources.length > 0 && !isLoading && (
                            <motion.div
                                key="grid"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                            >
                                <AnimatePresence>
                                    {filteredResources.map((res, index) => (
                                        <motion.div
                                            key={res.id}
                                            initial={{
                                                opacity: 0,
                                                y: 50,
                                                scale: 0.9,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                y: 0,
                                                scale: 1,
                                            }}
                                            exit={{
                                                opacity: 0,
                                                y: -50,
                                                scale: 0.9,
                                            }}
                                            transition={{
                                                duration: 0.4,
                                                delay: index * 0.1,
                                                type: "spring",
                                                stiffness: 100,
                                            }}
                                            whileHover={{ y: -5 }}
                                            className="h-full"
                                        >
                                            <Card
                                                resource_id={res.id}
                                                title={res.title}
                                                description={res.description}
                                                type={res.type}
                                                photo={
                                                    res.photos &&
                                                    res.photos.length > 0
                                                        ? res.photos[0]
                                                              .photo_url
                                                        : undefined
                                                }
                                                owner_id={res.owner_id}
                                                owner_name={
                                                    res.owner?.name ||
                                                    res.owner_name
                                                }
                                                owner_latitude={
                                                    res.owner_latitude
                                                }
                                                owner_longitude={
                                                    res.owner_longitude
                                                }
                                                owner_address={
                                                    res.owner_address
                                                }
                                                current_user_id={
                                                    userLocation?.id || 0
                                                }
                                                current_latitude={
                                                    userLocation?.latitude
                                                }
                                                current_longitude={
                                                    userLocation?.longitude
                                                }
                                                rating={res.average_rating || 0}
                                                reviewCount={
                                                    res.review_count || 0
                                                }
                                                onReviewSubmitted={
                                                    refreshResources
                                                }
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Main;
