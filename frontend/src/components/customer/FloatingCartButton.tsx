import React, { useState } from "react";
import { useCart } from "../../context/customer/cart/useCart";
import { HiOutlineShoppingCart } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import GuestLoginModal from "./GuestLoginModal";

interface FloatingCartButtonProps {
  onCartClick: () => void;
}

const FloatingCartButton: React.FC<FloatingCartButtonProps> = ({ onCartClick }) => {
  const { cartCount, totalPrice } = useCart();
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <button
              onClick={onCartClick}
              className="flex items-center justify-between gap-4 bg-[#387c40] text-white font-bold rounded-full shadow-lg px-6 py-3 hover:bg-[#144a31] transition-colors"
            >
              <div className="flex items-center gap-2">
                <HiOutlineShoppingCart size={22} />
                <span>
                  {cartCount} {cartCount === 1 ? "Item" : "Items"}
                </span>
              </div>
              <div className="border-l border-[#2d9665] pl-4">
                <span>₹{totalPrice.toFixed(2)}</span>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <GuestLoginModal
        isOpen={isGuestModalOpen}
        onClose={() => setIsGuestModalOpen(false)}
      />
    </>
  );
};

export default FloatingCartButton;
