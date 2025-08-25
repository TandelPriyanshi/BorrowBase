import { useState } from "react";
import { FiSearch, FiLogOut } from "react-icons/fi";
import { MdAddCircle } from "react-icons/md";
import { useLocation, useNavigate } from "react-router-dom";
import Input from "./input";
import IconButton from "./icon_button";
import Modal from "./modal";
import AddResourceForm from "../Profile/AddResourceForm";

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

  const isHome = location.pathname === "/home";
  const isChat = location.pathname === "/chat";

  const confirmLogout = async () => {
    try {
      await fetch("http://localhost:3000/api/logout", {
        method: "POST",
        credentials: "include",
      });
      navigate("/");
    } catch (error) {
      navigate("/");
    }
  };

  return (
    <nav className="relative dark:bg-gray-800 shadow-md px-6 py-3 flex items-center justify-between h-[64px] w-full">
      {/* Left: Logo */}
      <div className="text-xl font-bold text-white z-10">Borrow Base</div>

      {/* Center: Search - only on home */}
      {isHome && (
        <div className="absolute left-1/2 transform -translate-x-1/2 w-full max-w-md pt-3 z-0">
          <Input
            label=""
            type="text"
            id="search"
            placeholder="Search..."
            icon={<FiSearch />}
          />
        </div>
      )}

      {/* Right: Icons - only if not chat */}
      {!isChat && (
        <div className="flex items-center space-x-4 z-10">
          <IconButton
            icon={<FiLogOut />}
            ariaLabel="Logout"
            onClick={() => setShowLogoutModal(true)}
          />
          <IconButton
            icon={<MdAddCircle />}
            ariaLabel="Add Resource"
            onClick={() => setShowAddModal(true)}
          />
        </div>
      )}

      {/* Add Resource Modal */}
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)}>
          <AddResourceForm onClose={() => setShowAddModal(false)} />
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
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
              >
                Yes
              </button>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400"
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
