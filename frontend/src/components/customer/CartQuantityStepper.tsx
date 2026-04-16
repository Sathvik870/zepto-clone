import React, { useState, useRef, useEffect } from "react";
import { useCart } from "../../context/customer/cart/useCart";
import type { CartItem } from "../../context/customer/cart/CartContext";
import { HiPlus, HiMinus, HiExclamation } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import { calculateMaxCartableQuantity } from '../../utils/unitConverter';

interface CartQuantityStepperProps {
  item: CartItem;
}

const CartQuantityStepper: React.FC<CartQuantityStepperProps> = ({ item }) => {
  const { getItemQuantity, incrementItem, decrementItem, setItemQuantity } =
    useCart();
  const quantity = getItemQuantity(item.product_id);
  const maxCartableQuantity = calculateMaxCartableQuantity(
    item.saleable_quantity,
    item.unit_type,
    item.sell_per_unit_qty!,
    item.selling_unit!
  );
  const isAtMaxStock = quantity >= maxCartableQuantity;
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(quantity));
  const [showTooltip, setShowTooltip] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setInputValue(quantity === 0 ? "" : String(quantity));
      inputRef.current?.focus();
      inputRef.current?.select();
    } else {
      setShowTooltip(false);
    }
  }, [isEditing, quantity]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    const sanitizedValue = value.replace(/[^0-9]/g, "");
    if (sanitizedValue === "") {
      setShowTooltip(false);
      return;
    }

    const numericValue = parseInt(sanitizedValue, 10);
    if (numericValue > maxCartableQuantity) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
    } else {
      setShowTooltip(false);
    }
  };

  const handleFinalUpdate = () => {
    setIsEditing(false);
    let finalQuantity = parseInt(inputValue, 10);
    if (isNaN(finalQuantity)) {
      finalQuantity = 0;
    }
    if (finalQuantity > maxCartableQuantity) {
      finalQuantity = maxCartableQuantity;
    }
    setItemQuantity(item.product_id, finalQuantity);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleFinalUpdate();
    }
  };

  return (
    <div className="relative flex items-center justify-between bg-green-100 text-green-700 font-bold rounded-lg w-20 h-8">
      <button
        onClick={() => decrementItem(item.product_id)}
        className="px-2 h-full rounded-l-lg hover:bg-green-200"
      >
        <HiMinus size={12} />
      </button>

      <div className="flex-grow w-6 flex items-center justify-center">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleFinalUpdate}
            onKeyDown={handleKeyDown}
            className="w-full text-center text-sm bg-transparent outline-none"
          />
        ) : (
          <span
            onClick={() => setIsEditing(true)}
            className="cursor-pointer w-full h-full flex items-center justify-center text-sm"
          >
            {Math.floor(quantity)}
          </span>
        )}
      </div>

      <button
        onClick={() => incrementItem(item.product_id)}
        disabled={isAtMaxStock}
        className="px-2 h-full rounded-r-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <HiPlus size={12} />
      </button>
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded-md py-1 px-2.5 shadow-lg whitespace-nowrap flex items-center gap-1"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
          >
            <HiExclamation className="text-yellow-400" />
            Max: {maxCartableQuantity}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CartQuantityStepper;
