import { useContext } from "react";
import { CartContext } from "./CartContext.ts";
import type { CartContextType } from "./CartContext.ts";

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};