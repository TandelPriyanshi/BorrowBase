import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaTimes, FaHistory } from "react-icons/fa";

interface SearchSuggestionsProps {
    value: string;
    onChange: (value: string) => void;
    onSelect: (value: string) => void;
    suggestions: string[];
    isLoading?: boolean;
    placeholder?: string;
    className?: string;
}

const SearchSuggestions = ({
    value,
    onChange,
    onSelect,
    suggestions,
    isLoading = false,
    placeholder = "Search resources, categories, or owners...",
    className = "",
}: SearchSuggestionsProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("recentSearches");
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved));
            } catch (error) {
                console.error("Error parsing recent searches:", error);
            }
        }
    }, []);

    // Save recent searches to localStorage
    const saveRecentSearch = (searchTerm: string) => {
        if (!searchTerm.trim()) return;

        const updated = [
            searchTerm,
            ...recentSearches.filter((s) => s !== searchTerm),
        ].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem("recentSearches", JSON.stringify(updated));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        onChange(newValue);
        setIsOpen(newValue.length > 0 || recentSearches.length > 0);
        setSelectedIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        const allSuggestions = value.length > 0 ? suggestions : recentSearches;

        if (!isOpen) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev < allSuggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                break;
            case "Enter":
                e.preventDefault();
                if (
                    selectedIndex >= 0 &&
                    selectedIndex < allSuggestions.length
                ) {
                    handleSelect(allSuggestions[selectedIndex]);
                } else if (value.trim()) {
                    handleSelect(value.trim());
                }
                break;
            case "Escape":
                setIsOpen(false);
                setSelectedIndex(-1);
                inputRef.current?.blur();
                break;
        }
    };

    const handleSelect = (selectedValue: string) => {
        onChange(selectedValue);
        onSelect(selectedValue);
        setIsOpen(false);
        setSelectedIndex(-1);
        saveRecentSearch(selectedValue);
        inputRef.current?.blur();
    };

    const handleClear = () => {
        onChange("");
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.focus();
    };

    const handleFocus = () => {
        setIsOpen(value.length > 0 || recentSearches.length > 0);
    };

    const handleBlur = () => {
        // Delay closing to allow for click events on suggestions
        setTimeout(() => {
            setIsOpen(false);
            setSelectedIndex(-1);
        }, 150);
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem("recentSearches");
    };

    const displaySuggestions = value.length > 0 ? suggestions : recentSearches;
    const showRecentLabel = value.length === 0 && recentSearches.length > 0;

    return (
        <div className={`relative ${className}`}>
            <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    className="w-full pl-10 pr-10 py-3 bg-gray-700 text-white placeholder-gray-400 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                    disabled={isLoading}
                />
                {value && (
                    <motion.button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <FaTimes />
                    </motion.button>
                )}
            </div>

            <AnimatePresence>
                {isOpen && displaySuggestions.length > 0 && (
                    <motion.div
                        ref={suggestionsRef}
                        className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {showRecentLabel && (
                            <div className="px-4 py-2 border-b border-gray-700 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                    <FaHistory />
                                    Recent Searches
                                </div>
                                <button
                                    onClick={clearRecentSearches}
                                    className="text-gray-500 hover:text-gray-300 text-xs cursor-pointer"
                                >
                                    Clear
                                </button>
                            </div>
                        )}

                        {displaySuggestions.map((suggestion, index) => (
                            <motion.div
                                key={`${suggestion}-${index}`}
                                className={`px-4 py-3 cursor-pointer transition-colors duration-150 flex items-center gap-2 ${
                                    index === selectedIndex
                                        ? "bg-blue-500 text-white"
                                        : "text-gray-300 hover:bg-gray-700"
                                }`}
                                onClick={() => handleSelect(suggestion)}
                                whileHover={{
                                    backgroundColor:
                                        index === selectedIndex
                                            ? "#3b82f6"
                                            : "#374151",
                                }}
                            >
                                <FaSearch className="text-xs opacity-60" />
                                <span className="truncate">{suggestion}</span>
                            </motion.div>
                        ))}

                        {isLoading && (
                            <div className="px-4 py-3 text-gray-400 text-sm text-center">
                                Searching...
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SearchSuggestions;
