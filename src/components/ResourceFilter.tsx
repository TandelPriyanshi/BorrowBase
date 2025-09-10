import { useState, useEffect, useCallback } from "react";
import {
    FaFilter,
    FaSearch,
    FaMapMarkerAlt,
    FaTimes,
    FaSort,
    FaClock,
    FaStar,
    FaRuler,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import SearchSuggestions from "./SearchSuggestions";

interface ResourceFilterProps {
    onFilterChange: (filters: FilterOptions) => void;
    isLoading?: boolean;
    allResources?: any[]; // For generating search suggestions
}

export interface FilterOptions {
    search: string;
    type: string;
    category: string;
    maxDistance: number;
    sortBy:
        | "recent"
        | "distance"
        | "rating"
        | "price_low"
        | "price_high"
        | "name";
    priceRange: { min: number; max: number };
    availability: string;
    condition: string;
}

const ResourceFilter = ({
    onFilterChange,
    isLoading = false,
    allResources = [],
}: ResourceFilterProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [filters, setFilters] = useState<FilterOptions>({
        search: "",
        type: "",
        category: "",
        maxDistance: 10,
        sortBy: "recent",
        priceRange: { min: 0, max: 1000 },
        availability: "",
        condition: "",
    });

    const categories = [
        "Electronics",
        "Tools",
        "Sports",
        "Books",
        "Furniture",
        "Kitchen",
        "Garden",
        "Automotive",
        "Fashion",
        "Musical Instruments",
        "Art & Crafts",
        "Health & Beauty",
        "Baby & Kids",
        "Pet Supplies",
        "Other",
    ];

    const conditions = ["New", "Like New", "Good", "Fair", "Poor"];

    const availabilityOptions = [
        "Available Now",
        "Available Soon",
        "Currently Borrowed",
    ];

    // Generate search suggestions from resources
    const generateSuggestions = useCallback(
        (query: string): string[] => {
            if (!query || query.length < 2) return [];

            const suggestions = new Set<string>();
            const queryLower = query.toLowerCase();

            allResources.forEach((resource) => {
                // Add title matches
                if (resource.title?.toLowerCase().includes(queryLower)) {
                    suggestions.add(resource.title);
                }

                // Add category matches
                if (resource.category?.toLowerCase().includes(queryLower)) {
                    suggestions.add(resource.category);
                }

                // Add owner name matches
                const ownerName = resource.owner?.name || resource.owner_name;
                if (ownerName?.toLowerCase().includes(queryLower)) {
                    suggestions.add(ownerName);
                }

                // Add description keyword matches
                if (resource.description?.toLowerCase().includes(queryLower)) {
                    const words = resource.description.toLowerCase().split(" ");
                    words.forEach((word) => {
                        if (word.startsWith(queryLower) && word.length > 2) {
                            suggestions.add(word);
                        }
                    });
                }
            });

            return Array.from(suggestions).slice(0, 8);
        },
        [allResources]
    );

    const searchSuggestions = generateSuggestions(searchValue);

    // Debounced search
    const debouncedSearch = useCallback(
        (value: string) => {
            const timeoutId = setTimeout(() => {
                const newFilters = { ...filters, search: value };
                setFilters(newFilters);
                onFilterChange(newFilters);
            }, 300);
            return () => clearTimeout(timeoutId);
        },
        [filters, onFilterChange]
    );

    useEffect(() => {
        const cleanup = debouncedSearch(searchValue);
        return cleanup;
    }, [searchValue, debouncedSearch]);

    const handleFilterChange = (
        key: keyof FilterOptions,
        value: string | number | { min: number; max: number }
    ) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const handleSearchSelect = (value: string) => {
        setSearchValue(value);
        const newFilters = { ...filters, search: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const clearFilters = () => {
        const defaultFilters: FilterOptions = {
            search: "",
            type: "",
            category: "",
            maxDistance: 10,
            sortBy: "recent",
            priceRange: { min: 0, max: 1000 },
            availability: "",
            condition: "",
        };
        setFilters(defaultFilters);
        setSearchValue("");
        onFilterChange(defaultFilters);
    };

    const activeFiltersCount = Object.values(filters).filter((value) => {
        if (typeof value === "object" && value !== null) {
            return value.min !== 0 || value.max !== 1000;
        }
        return value !== "" && value !== 10 && value !== "recent";
    }).length;

    const sortOptions = [
        { value: "recent", label: "Recent", icon: FaClock },
        { value: "distance", label: "Distance", icon: FaMapMarkerAlt },
        { value: "rating", label: "Rating", icon: FaStar },
        { value: "name", label: "Name", icon: FaSort },
        { value: "price_low", label: "Price: Low to High", icon: FaRuler },
        { value: "price_high", label: "Price: High to Low", icon: FaRuler },
    ];

    return (
        <motion.div
            className="bg-gray-800 rounded-lg shadow-lg mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Filter Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <FaFilter className="text-blue-400" />
                    <h3 className="text-white font-medium">Search & Filters</h3>
                    {activeFiltersCount > 0 && (
                        <motion.span
                            className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500 }}
                        >
                            {activeFiltersCount}
                        </motion.span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {activeFiltersCount > 0 && (
                        <motion.button
                            onClick={clearFilters}
                            className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 cursor-pointer transition-colors duration-200"
                            disabled={isLoading}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <FaTimes className="text-xs" />
                            Clear All
                        </motion.button>
                    )}
                    <motion.button
                        onClick={() => setIsOpen(!isOpen)}
                        className="text-blue-400 hover:text-blue-300 text-sm cursor-pointer transition-colors duration-200"
                        disabled={isLoading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {isOpen ? "Hide" : "Show"} Filters
                    </motion.button>
                </div>
            </div>

            {/* Enhanced Search Bar with Suggestions - Always Visible */}
            <div className="p-4 border-b border-gray-700">
                <SearchSuggestions
                    value={searchValue}
                    onChange={setSearchValue}
                    onSelect={handleSearchSelect}
                    suggestions={searchSuggestions}
                    isLoading={isLoading}
                    placeholder="Search resources, categories, or owners..."
                />
            </div>

            {/* Collapsible Filter Options */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="p-4 space-y-6"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Quick Sort Options */}
                        <div>
                            <label className="block text-white text-sm font-medium mb-3">
                                <FaSort className="inline mr-2" />
                                Sort By
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                                {sortOptions.map((option) => {
                                    const IconComponent = option.icon;
                                    return (
                                        <motion.button
                                            key={option.value}
                                            onClick={() =>
                                                handleFilterChange(
                                                    "sortBy",
                                                    option.value as FilterOptions["sortBy"]
                                                )
                                            }
                                            className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                                                filters.sortBy === option.value
                                                    ? "bg-blue-500 text-white shadow-lg"
                                                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                            }`}
                                            disabled={isLoading}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <IconComponent className="text-xs" />
                                            {option.label}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Type and Category Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Type Filter */}
                            <div>
                                <label className="block text-white text-sm font-medium mb-2">
                                    Resource Type
                                </label>
                                <select
                                    value={filters.type}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            "type",
                                            e.target.value
                                        )
                                    }
                                    className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                                    disabled={isLoading}
                                >
                                    <option value="">All Types</option>
                                    <option value="lend">Lend</option>
                                    <option value="exchange">Exchange</option>
                                </select>
                            </div>

                            {/* Category Filter */}
                            <div>
                                <label className="block text-white text-sm font-medium mb-2">
                                    Category
                                </label>
                                <select
                                    value={filters.category}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            "category",
                                            e.target.value
                                        )
                                    }
                                    className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                                    disabled={isLoading}
                                >
                                    <option value="">All Categories</option>
                                    {categories.map((category) => (
                                        <option
                                            key={category}
                                            value={category.toLowerCase()}
                                        >
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Condition and Availability Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Condition Filter */}
                            <div>
                                <label className="block text-white text-sm font-medium mb-2">
                                    Condition
                                </label>
                                <select
                                    value={filters.condition}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            "condition",
                                            e.target.value
                                        )
                                    }
                                    className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                                    disabled={isLoading}
                                >
                                    <option value="">Any Condition</option>
                                    {conditions.map((condition) => (
                                        <option
                                            key={condition}
                                            value={condition.toLowerCase()}
                                        >
                                            {condition}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Availability Filter */}
                            <div>
                                <label className="block text-white text-sm font-medium mb-2">
                                    Availability
                                </label>
                                <select
                                    value={filters.availability}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            "availability",
                                            e.target.value
                                        )
                                    }
                                    className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                                    disabled={isLoading}
                                >
                                    <option value="">Any Availability</option>
                                    {availabilityOptions.map((option) => (
                                        <option
                                            key={option}
                                            value={option.toLowerCase()}
                                        >
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Distance Filter */}
                        <div>
                            <label className="block text-white text-sm font-medium mb-3">
                                <FaMapMarkerAlt className="inline mr-2" />
                                Max Distance: {filters.maxDistance}km
                            </label>
                            <div className="relative">
                                <input
                                    type="range"
                                    min="1"
                                    max="50"
                                    value={filters.maxDistance}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            "maxDistance",
                                            parseInt(e.target.value)
                                        )
                                    }
                                    className="w-full accent-blue-400 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                    disabled={isLoading}
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-2">
                                    <span>1km</span>
                                    <span>25km</span>
                                    <span>50km</span>
                                </div>
                            </div>
                        </div>

                        {/* Price Range Filter */}
                        <div>
                            <label className="block text-white text-sm font-medium mb-3">
                                <FaRuler className="inline mr-2" />
                                Price Range: ${filters.priceRange.min} - $
                                {filters.priceRange.max}
                            </label>
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={filters.priceRange.min}
                                        onChange={(e) =>
                                            handleFilterChange("priceRange", {
                                                ...filters.priceRange,
                                                min:
                                                    parseInt(e.target.value) ||
                                                    0,
                                            })
                                        }
                                        className="p-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-400"
                                        disabled={isLoading}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={filters.priceRange.max}
                                        onChange={(e) =>
                                            handleFilterChange("priceRange", {
                                                ...filters.priceRange,
                                                max:
                                                    parseInt(e.target.value) ||
                                                    1000,
                                            })
                                        }
                                        className="p-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-400"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ResourceFilter;
