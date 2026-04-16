import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCustomerAuth } from "../../context/customer/auth/useCustomerAuth";
import { useCart } from "../../context/customer/cart/useCart";
import { motion } from "framer-motion";
import {
  HiOutlineUser,
  HiOutlineClipboardList,
  HiOutlineLogout,
} from "react-icons/hi";

interface ProfileDropdownProps {
  onClose: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onClose }) => {
  const { logout } = useCustomerAuth();
  const { clearCart } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(clearCart);
    onClose();
    navigate("/");
  };

  const menuItems = [
    { name: "My Profile", icon: <HiOutlineUser />, path: "/profile" },
    { name: "Orders", icon: <HiOutlineClipboardList />, path: "/orders" },
  ];

  return (
    <motion.div
      className="absolute top-full right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50 overflow-hidden"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="py-2">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {item.icon}
            <span>{item.name}</span>
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <HiOutlineLogout />
          <span>Logout</span>
        </button>
      </div>
    </motion.div>
  );
};

export default ProfileDropdown;
