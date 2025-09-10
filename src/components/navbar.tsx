import { useState } from "react";
import { FiLogOut, FiPlus } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import IconButton from "./icon_button";
import Modal from "./modal";
import AddResourceForm from "../Profile/AddResourceForm";
import { useAuth } from "../Auth/authContext";

interface NavbarProps {
    onResourceAdded?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onResourceAdded }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

    const isHome = location.pathname === "/home";
    const isChat = location.pathname === "/chat";

    const confirmLogout = () => {
        // Close the modal first
        setShowLogoutModal(false);
        // Use the auth context logout function which handles everything properly
        logout();
    };

    const handleResourceAdded = () => {
        if (onResourceAdded) {
            onResourceAdded();
        }
        setShowAddModal(false);
    };

    return (
        <nav className="bg-gradient-to-r from-gray-800 to-gray-900 shadow-lg px-6 py-4 flex items-center justify-between h-16 w-full border-b border-gray-700">
            {/* Left: Logo */}
            <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">BB</span>
                </div>
                <span className="text-xl font-bold text-white">
                    Borrow Base
                </span>
            </div>

            {/* Right: Actions - only if not chat */}
            {!isChat && (
                <div className="flex items-center space-x-3">
                    {/* Add Resource Button */}
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium shadow-sm cursor-pointer"
                    >
                        <FiPlus className="w-4 h-4" />
                        <span>Add Resource</span>
                    </button>

                    {/* Logout Button */}
                    <IconButton
                        icon={<FiLogOut className="w-5 h-5" />}
                        ariaLabel="Logout"
                        onClick={() => setShowLogoutModal(true)}
                        className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors duration-200"
                    />
                </div>
            )}

            {/* Add Resource Modal */}
            {showAddModal && (
                <Modal onClose={() => setShowAddModal(false)}>
                    <AddResourceForm
                        onClose={() => setShowAddModal(false)}
                        onSuccess={handleResourceAdded}
                    />
                </Modal>
            )}

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <Modal onClose={() => setShowLogoutModal(false)}>
                    <div className="p-6 text-center dark:bg-gray-800 rounded-lg">
                        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                            Are you sure you want to logout?
                        </h2>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={confirmLogout}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 cursor-pointer transition-colors duration-200"
                            >
                                Yes
                            </button>
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 cursor-pointer transition-colors duration-200"
                            >
                                No
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </nav>
    );
};

export default Navbar;
