import React, { useState, useRef, useEffect } from "react";
import type { ProductWithImage } from "../../pages/admin/ProductsPage";
import { useCart } from "../../context/customer/cart/useCart.ts";
import { HiPlus, HiMinus, HiExclamation } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import { calculateMaxCartableQuantity } from "../../utils/unitConverter";

interface QuantityStepperProps {
  product: ProductWithImage;
  onEditingChange: (isEditing: boolean) => void;
}

const QuantityStepper: React.FC<QuantityStepperProps> = ({
  product,
  onEditingChange,
}) => {
  const { getItemQuantity, incrementItem, decrementItem, setItemQuantity } =
    useCart();
  const quantity = getItemQuantity(product.product_id);
  const maxCartableQuantity = calculateMaxCartableQuantity(
    product.saleable_quantity,
    product.unit_type,
    product.sell_per_unit_qty!,
    product.selling_unit!
  );
  const isAtMaxStock = quantity >= maxCartableQuantity;
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(String(quantity));
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    onEditingChange(isEditing);
    if (isEditing && inputRef.current) {
      setInputValue(quantity === 0 ? "" : String(quantity));
      inputRef.current.focus();
      inputRef.current.select();
    } else {
      setShowTooltip(false);
    }
  }, [isEditing, onEditingChange, quantity]);

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
    setItemQuantity(product.product_id, finalQuantity);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleFinalUpdate();
    }
  };

  return (
    <div className="relative flex items-center justify-between bg-[#387c40] text-white font-bold rounded-lg w-24 h-9">
      <button
        onClick={() => decrementItem(product.product_id)}
        className="px-3 py-1 h-full flex-shrink-0 flex items-center justify-center rounded-l-lg transition-colors"
      >
        <HiMinus size={16} />
      </button>
      <div className="flex-grow w-8 flex items-center justify-center">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleFinalUpdate}
            onKeyDown={handleKeyDown}
            className="w-full text-center bg-transparent outline-none appearance-none [-moz-appearance:textfield]"
          />
        ) : (
          <span
            onClick={() => setIsEditing(true)}
            className="cursor-pointer w-full h-full flex items-center justify-center"
          >
            {Math.floor(quantity)}
          </span>
        )}
      </div>

      <button
        onClick={() => incrementItem(product.product_id)}
        disabled={isAtMaxStock}
        className="px-3 py-1 h-full flex-shrink-0 flex items-center justify-center rounded-r-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <HiPlus size={16} />
      </button>
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded-md py-1.5 px-3 shadow-lg whitespace-nowrap flex items-center gap-1.5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <HiExclamation className="text-yellow-400" />
            Max quantity is {maxCartableQuantity}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProductCard: React.FC<{ product: ProductWithImage }> = ({ product }) => {
  const { addToCart, getItemQuantity } = useCart();
  const quantity = getItemQuantity(product.product_id);

  const [isStepperEditing, setIsStepperEditing] = useState(false);
  const maxPossibleUnits = calculateMaxCartableQuantity(
    product.saleable_quantity,
    product.unit_type,
    product.sell_per_unit_qty!,
    product.selling_unit!
  );

  const isOutOfStock = product.saleable_quantity <= 0 || maxPossibleUnits < 1;
  const showAddButton = !isOutOfStock && quantity === 0 && !isStepperEditing;
  const showStepper = !isOutOfStock && (quantity > 0 || isStepperEditing);
  return (
    <div
      className={`group bg-white border rounded-lg shadow-sm p-3 flex flex-col justify-between transition-shadow h-72
      ${isOutOfStock ? "border-gray-200" : "hover:shadow-lg border-gray-200"}`}
    >
      <div>
        <div className="relative w-full h-36 mb-3 overflow-hidden rounded-md">
          <img
            src={product.imageUrl || "https://via.placeholder.com/200"}
            alt={product.product_name}
            className={`w-full h-full object-cover transition-transform duration-300 ${
              !isOutOfStock && "group-hover:scale-105"
            } ${isOutOfStock && "filter grayscale"}`}
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-[#00000065] flex items-center justify-center rounded-md">
              <span className="text-white font-bold text-xs bg-gray-800 bg-opacity-70 px-3 py-1 rounded-full">
                OUT OF STOCK
              </span>
            </div>
          )}
        </div>

        <h3
          className={`font-semibold text-sm leading-tight mb-1 h-10 ${
            isOutOfStock ? "text-gray-400" : "text-gray-800"
          }`}
        >
          {product.product_name}
        </h3>
        <p
          className={`text-sm ${
            isOutOfStock ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {product.sell_per_unit_qty} {product.selling_unit}
        </p>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span
          className={`font-bold ${
            isOutOfStock ? "text-gray-400" : "text-gray-900"
          }`}
        >
          ₹{product.selling_price}
        </span>
        {showAddButton && (
          <button
            onClick={() => addToCart(product)}
            className="border-2 border-[#387c40] text-green-700 font-bold px-6 py-1.5 rounded-lg hover:bg-[#387c40] hover:text-white transition-all duration-300"
          >
            ADD
          </button>
        )}

        {showStepper && (
          <QuantityStepper
            product={product}
            onEditingChange={setIsStepperEditing}
          />
        )}

        {isOutOfStock && (
          <button
            disabled
            className="border-2 border-gray-300 text-gray-400 font-bold px-6 py-1.5 rounded-lg cursor-not-allowed"
          >
            ADD
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
