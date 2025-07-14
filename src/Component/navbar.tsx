import { useState } from "react";
import { FiMapPin, FiSearch } from "react-icons/fi";
import { MdAddCircle } from "react-icons/md";
import { useLocation, useNavigate } from "react-router-dom";
import Input from "../Component/input";
import IconButton from "../Component/icon_button";
import Modal from "../Component/modal";
import AddResourceForm from "../Profile/AddResourceForm";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [showAddModal, setShowAddModal] = useState(false);

  const isHome = location.pathname === "/home";
  const isChat = location.pathname === "/chat";

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
            icon={<FiMapPin />}
            ariaLabel="Location"
            onClick={() => navigate("/profile")}
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
    </nav>
  );
};

export default Navbar;
