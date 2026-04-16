import { createContext } from "react";
import type { ProductWithImage } from "../../../pages/admin/ProductsPage";

export interface CartItem extends ProductWithImage {
  quantity: number;
}

export type CartValidationMessages = {
  [productId: number]: string;
};

export interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  totalPrice: number;
  addToCart: (product: ProductWithImage) => void;
  getItemQuantity: (productId: number) => number;
  incrementItem: (productId: number) => void;
  decrementItem: (productId: number) => void;
  setItemQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  validationMessages: CartValidationMessages;
  validateCart: () => Promise<void>;
  removeItem: (productId: number) => void;
  isCartValidForCheckout: boolean;
  isValidating: boolean;
}

export const CartContext = createContext<CartContextType | undefined>(
  undefined
);
