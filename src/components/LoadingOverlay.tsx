import React from 'react';
import { motion } from 'framer-motion';
import { FaUpload, FaSpinner } from 'react-icons/fa';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  progress?: number;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isVisible, 
  message = "Adding your resource...", 
  progress 
}) => {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 rounded-2xl"
    >
      <div className="bg-gray-800 rounded-2xl p-8 max-w-sm w-full mx-4 border border-gray-700 shadow-2xl">
        <div className="text-center">
          {/* Animated Upload Icon */}
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
            }}
            className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-6"
          >
            <FaUpload className="w-6 h-6 text-white" />
          </motion.div>

          {/* Loading Text */}
          <h3 className="text-xl font-semibold text-white mb-2">
            Processing...
          </h3>
          <p className="text-gray-300 mb-6">
            {message}
          </p>

          {/* Progress Bar (if progress is provided) */}
          {progress !== undefined && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <motion.div
                  className="bg-blue-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          )}

          {/* Animated Dots */}
          <div className="flex justify-center space-x-1">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-2 h-2 bg-blue-400 rounded-full"
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          {/* Additional Info */}
          <p className="text-xs text-gray-500 mt-4">
            Please don't close this window while we process your request
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default LoadingOverlay;
