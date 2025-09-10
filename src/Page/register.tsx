import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Auth/authContext";
import Input from "../components/input";
import Button from "../components/button";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { toast } from "react-toastify";
import { FaUser, FaHome, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaUserPlus, FaCheck } from "react-icons/fa";
import { useLocationRequest } from "../Location/useLocationRequest";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    email: "",
    password: "",
    agree: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  const { isAuthenticated, register: authRegister } = useAuth();
  const { requestLocationPermission } = useLocationRequest();

  // Redirect if already authenticated using useEffect
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/home");
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));
    setError(""); // Clear error when user types
  };

  const handleRegister = async () => {
    // Basic validation
    if (!formData.name || !formData.email || !formData.password || !formData.address) {
      setError("Please fill in all fields");
      return;
    }

    if (!formData.agree) {
      setError("You must agree to the Terms & Conditions.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Use the auth context register method
      await authRegister({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        address: formData.address
      });
      
      // Show success message
      toast.success("Registration successful! Welcome to BorrowBase!");
      
      // Request location permission after successful registration
      // This runs in the background and won't block navigation
      setTimeout(() => {
        requestLocationPermission(true).catch(err => 
          console.log("Location permission declined or failed:", err)
        );
      }, 1500); // Longer delay to let the user see success message
      
      // Redirect to home page
      setTimeout(() => {
        navigate("/home");
      }, 500); // Small delay to show the success message
      
    } catch (err: any) {
      console.error("Registration error:", err);
      const errorMessage = err.response?.data?.message || "Something went wrong. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-gradient-to-r from-pink-400 to-purple-600 rounded-full opacity-10 blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, type: "spring", stiffness: 300, damping: 30 }}
        className="relative z-10 bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 w-full max-w-2xl"
      >
        {/* Logo/Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
          className="flex justify-center mb-8"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
            <FaUserPlus className="text-white text-2xl" />
          </div>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold text-white mb-2">
            Join Our Community
          </h2>
          <p className="text-gray-300">
            Create your account and start sharing resources
          </p>
        </motion.div>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {/* Personal Information */}
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Address
              </label>
              <div className="relative">
                <FaHome className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type="text"
                  id="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Your address"
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                  required
                />
              </div>
            </div>
          </motion.div>

          {/* Account Information */}
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                  required
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Terms Agreement */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-white/5 rounded-xl p-4 border border-white/10"
          >
            <motion.div 
              className="flex items-start space-x-3"
              whileHover={{ scale: 1.01 }}
            >
              <div className="relative">
                <input
                  type="checkbox"
                  id="agree"
                  checked={formData.agree}
                  onChange={handleChange}
                  className="sr-only"
                />
                <motion.label
                  htmlFor="agree"
                  className={`block w-5 h-5 rounded border-2 cursor-pointer transition-all duration-200 ${
                    formData.agree 
                      ? 'bg-gradient-to-br from-purple-500 to-pink-600 border-purple-500' 
                      : 'border-gray-400 hover:border-purple-400'
                  }`}
                  whileTap={{ scale: 0.9 }}
                >
                  {formData.agree && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center justify-center h-full"
                    >
                      <FaCheck className="text-white text-xs" />
                    </motion.div>
                  )}
                </motion.label>
              </div>
              <label htmlFor="agree" className="text-sm text-gray-300 leading-relaxed cursor-pointer">
                I agree to the{" "}
                <motion.a 
                  whileHover={{ scale: 1.05 }}
                  href="#" 
                  className="text-purple-400 font-medium hover:text-purple-300 underline" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Terms & Conditions
                </motion.a>{" "}
                and{" "}
                <motion.a 
                  whileHover={{ scale: 1.05 }}
                  href="#" 
                  className="text-purple-400 font-medium hover:text-purple-300 underline" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </motion.a>
              </label>
            </motion.div>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl p-4 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Register Button */}
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            onClick={handleRegister}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <FaUserPlus />
                <span>Create Account</span>
              </>
            )}
          </motion.button>
        </form>

        {/* Login Link */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-center"
        >
          <p className="text-gray-300 text-sm">
            Already have an account?{" "}
            <motion.span
              whileHover={{ scale: 1.05 }}
              className="text-purple-400 font-medium cursor-pointer hover:text-purple-300 transition-colors"
              onClick={() => navigate("/")}
            >
              Sign In
            </motion.span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Register;