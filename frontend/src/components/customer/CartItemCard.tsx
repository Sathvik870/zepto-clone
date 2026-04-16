import React from "react";
import { type CartItem } from "../../context/customer/cart/CartContext.ts";
import { useCart } from "../../context/customer/cart/useCart.ts";
import CartQuantityStepper from "./CartQuantityStepper";
import { HiOutlineTrash } from "react-icons/hi";

interface CartItemCardProps {
  item: CartItem;
}

const CartItemCard: React.FC<CartItemCardProps> = ({ item }) => {
  const { validationMessages, removeItem } = useCart();
  const message = validationMessages[item.product_id];
  const isOutOfStock = message === "Out of Stock";
  return (
    <div
      className={`flex items-center justify-between py-4 ${
        isOutOfStock ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <img
          src={item.imageUrl || ""}
          alt={item.product_name}
          className={`w-12 h-12 object-cover rounded-md ${
            isOutOfStock ? "filter grayscale" : ""
          }`}
        />
        <div>
          <p className="font-semibold text-sm text-gray-800">
            {item.product_name}
          </p>
          <p className="text-xs text-gray-500">
            {item.sell_per_unit_qty} {item.selling_unit}
          </p>
          {message && (
            <p className="text-xs font-semibold text-red-600 mt-1">{message}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className={isOutOfStock ? "pointer-events-none" : ""}>
          <CartQuantityStepper item={item} />
        </div>
        <div className="flex flex-col items-end w-16">
          <p className="font-semibold text-sm text-right">
            ₹{(item.selling_price * item.quantity).toFixed(2)}
          </p>
          <button
            onClick={() => removeItem(item.product_id)}
            className="text-gray-400 hover:text-red-600 mt-1"
          >
            <HiOutlineTrash size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItemCard;
