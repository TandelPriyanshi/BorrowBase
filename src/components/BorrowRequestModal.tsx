import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaTimes,
    FaCalendarAlt,
    FaEnvelope,
    FaHandHoldingHeart,
    FaClock,
} from "react-icons/fa";
import ApiService from "../services/apiService";
import { toast } from "react-toastify";
import LoadingSpinner from "./ui/LoadingSpinner";

interface BorrowRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    resourceId: number;
    resourceTitle: string;
    ownerName: string;
}

const BorrowRequestModal: React.FC<BorrowRequestModalProps> = ({
    isOpen,
    onClose,
    resourceId,
    resourceTitle,
    ownerName,
}) => {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Get today's date in YYYY-MM-DD format for min date
    const today = new Date().toISOString().split("T")[0];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!startDate || !endDate) {
            setError("Please select both start and end dates");
            return;
        }

        if (new Date(startDate) >= new Date(endDate)) {
            setError("End date must be after start date");
            return;
        }

        if (new Date(startDate) < new Date(today)) {
            setError("Start date cannot be in the past");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const response = await ApiService.createBorrowRequest({
                resource_id: resourceId,
                start_date: new Date(startDate).toISOString(),
                end_date: new Date(endDate).toISOString(),
                message:
                    message ||
                    `Hi ${ownerName}, I would like to borrow your item: ${resourceTitle}`,
            });

            toast.success(
                response.message || "Borrow request sent successfully!"
            );
            onClose();

            // Reset form
            setStartDate("");
            setEndDate("");
            setMessage("");
        } catch (err: any) {
            console.error("Borrow request failed:", err);
            const errorMessage =
                err?.response?.data?.message || "Something went wrong";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
            setStartDate("");
            setEndDate("");
            setMessage("");
            setError("");
        }
    };

    const calculateDuration = () => {
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        }
        return 0;
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex justify-center items-center p-4"
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 50 }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white/95 backdrop-blur-lg rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl border border-white/20"
                        >
                            {/* Header */}
                            <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"
                                        >
                                            <FaHandHoldingHeart className="text-2xl" />
                                        </motion.div>
                                        <div>
                                            <motion.h3
                                                initial={{ x: -20, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                transition={{ delay: 0.1 }}
                                                className="text-xl font-bold"
                                            >
                                                Request to Borrow
                                            </motion.h3>
                                            <motion.p
                                                initial={{ x: -20, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                transition={{ delay: 0.15 }}
                                                className="text-blue-100 text-sm"
                                            >
                                                Share resources, build community
                                            </motion.p>
                                        </div>
                                    </div>
                                    <motion.button
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.25 }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={handleClose}
                                        disabled={isSubmitting}
                                        className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50 cursor-pointer"
                                        aria-label="Close"
                                    >
                                        <FaTimes className="text-lg" />
                                    </motion.button>
                                </div>
                            </div>

                            <form
                                onSubmit={handleSubmit}
                                className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto"
                            >
                                {/* Resource Info */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200/50"
                                >
                                    <h4 className="font-bold text-gray-900 text-lg mb-1">
                                        {resourceTitle}
                                    </h4>
                                    <p className="text-gray-600 flex items-center">
                                        <span className="mr-2">👤</span>
                                        Owned by{" "}
                                        <span className="font-medium ml-1">
                                            {ownerName}
                                        </span>
                                    </p>
                                </motion.div>

                                {/* Date Selection */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="space-y-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <FaCalendarAlt className="text-blue-500" />
                                        <h5 className="font-semibold text-gray-900">
                                            Borrow Period
                                        </h5>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Start Date
                                            </label>
                                            <motion.input
                                                whileFocus={{ scale: 1.02 }}
                                                type="date"
                                                value={startDate}
                                                onChange={(e) =>
                                                    setStartDate(e.target.value)
                                                }
                                                min={today}
                                                required
                                                disabled={isSubmitting}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 transition-all duration-200"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                End Date
                                            </label>
                                            <motion.input
                                                whileFocus={{ scale: 1.02 }}
                                                type="date"
                                                value={endDate}
                                                onChange={(e) =>
                                                    setEndDate(e.target.value)
                                                }
                                                min={startDate || today}
                                                required
                                                disabled={isSubmitting}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 transition-all duration-200"
                                            />
                                        </div>
                                    </div>

                                    {/* Duration Display */}
                                    {calculateDuration() > 0 && (
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center space-x-2"
                                        >
                                            <FaClock className="text-green-600" />
                                            <span className="text-green-800 font-medium">
                                                Duration: {calculateDuration()}{" "}
                                                {calculateDuration() === 1
                                                    ? "day"
                                                    : "days"}
                                            </span>
                                        </motion.div>
                                    )}
                                </motion.div>

                                {/* Message */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="space-y-3"
                                >
                                    <div className="flex items-center space-x-2">
                                        <FaEnvelope className="text-purple-500" />
                                        <h5 className="font-semibold text-gray-900">
                                            Personal Message
                                        </h5>
                                        <span className="text-sm text-gray-500">
                                            (Optional)
                                        </span>
                                    </div>
                                    <motion.textarea
                                        whileFocus={{ scale: 1.01 }}
                                        value={message}
                                        onChange={(e) =>
                                            setMessage(e.target.value)
                                        }
                                        disabled={isSubmitting}
                                        placeholder={`Hi ${ownerName}, I would like to borrow your ${resourceTitle}. I'll take great care of it and return it in perfect condition!`}
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 resize-none transition-all duration-200"
                                    />
                                </motion.div>

                                {/* Error Message */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{
                                                height: "auto",
                                                opacity: 1,
                                            }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 flex items-center space-x-2"
                                        >
                                            <span className="text-red-500">
                                                ⚠️
                                            </span>
                                            <span className="font-medium">
                                                {error}
                                            </span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Action Buttons */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    className="flex gap-4 pt-2"
                                >
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="button"
                                        onClick={handleClose}
                                        disabled={isSubmitting}
                                        className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50"
                                    >
                                        Cancel
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        disabled={
                                            isSubmitting ||
                                            calculateDuration() === 0
                                        }
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <LoadingSpinner size="sm" />
                                                <span>Sending...</span>
                                            </>
                                        ) : (
                                            <>
                                                <FaHandHoldingHeart />
                                                <span>Send Request</span>
                                            </>
                                        )}
                                    </motion.button>
                                </motion.div>
                            </form>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default BorrowRequestModal;
