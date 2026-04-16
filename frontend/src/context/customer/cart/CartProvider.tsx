import { useState, useEffect, type ReactNode, useMemo } from "react";
import { useProducts } from "../product/useProducts";
import {
  CartContext,
  type CartItem,
  type CartValidationMessages,
} from "./CartContext.ts";
import type { ProductWithImage } from "../../../pages/admin/ProductsPage.tsx";
import { calculateMaxCartableQuantity } from "../../../utils/unitConverter";
const CART_STORAGE_KEY = "farmerLogisticsCart";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Failed to parse cart from localStorage", error);
      return [];
    }
  });

  const { products, fetchProducts } = useProducts();
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (error) {
      console.error("Failed to save cart to localStorage", error);
    }
  }, [cartItems]);

  const validationData = useMemo(() => {
    const messages: CartValidationMessages = {};
    if (products.length === 0 && cartItems.length > 0) {
      return { validationMessages: {}, isCartValidForCheckout: true };
    }

    cartItems.forEach((cartItem) => {
      const liveProduct = products.find(
        (p) => p.product_id === cartItem.product_id
      );
      let maxCartable = 0;
      if (liveProduct) {
        maxCartable = calculateMaxCartableQuantity(
          liveProduct.saleable_quantity,
          liveProduct.unit_type,
          liveProduct.sell_per_unit_qty!,
          liveProduct.selling_unit!
        );
      }

      if (
        !liveProduct ||
        liveProduct.saleable_quantity <= 0 ||
        maxCartable < 1
      ) {
        messages[cartItem.product_id] = "Out of Stock";
      } else if (cartItem.quantity > maxCartable) {
        messages[cartItem.product_id] = `Only ${maxCartable} available`;
      }
    });
    return {
      validationMessages: messages,
      isCartValidForCheckout: Object.keys(messages).length === 0,
    };
  }, [cartItems, products]);

  const { validationMessages, isCartValidForCheckout } = validationData;

  const validateCart = async () => {
    setIsValidating(true);
    await fetchProducts();
    setIsValidating(false);
  };

  const removeItem = (productId: number) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.product_id !== productId)
    );
  };

  const addToCart = (product: ProductWithImage) => {
    const maxUnits = calculateMaxCartableQuantity(
      product.saleable_quantity,
      product.unit_type,
      product.sell_per_unit_qty!,
      product.selling_unit!
    );
    if (maxUnits < 1) return;
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.product_id === product.product_id
      );
      if (existingItem) {
        return prevItems.map((item) =>
          item.product_id === product.product_id
            ? { ...item, quantity: 1 }
            : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  const incrementItem = (productId: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.product_id === productId) {
          const maxCartableQuantity = calculateMaxCartableQuantity(
            item.saleable_quantity,
            item.unit_type,
            item.sell_per_unit_qty!,
            item.selling_unit!
          );
          if (item.quantity < maxCartableQuantity) {
            return { ...item, quantity: item.quantity + 1 };
          }
        }
        return item;
      })
    );
  };

  const decrementItem = (productId: number) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.product_id === productId
      );
      if (existingItem && existingItem.quantity === 1) {
        return prevItems.filter((item) => item.product_id !== productId);
      }
      return prevItems.map((item) =>
        item.product_id === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
    });
  };

  const setItemQuantity = (productId: number, quantity: number) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.product_id === productId
      );
      if (!existingItem) return prevItems;

      const maxCartableQuantity = calculateMaxCartableQuantity(
        existingItem.saleable_quantity,
        existingItem.unit_type,
        existingItem.sell_per_unit_qty!,
        existingItem.selling_unit!
      );

      let newQuantity = quantity;
      if (newQuantity < 0) newQuantity = 0;
      if (newQuantity > maxCartableQuantity) {
        newQuantity = maxCartableQuantity;
      }

      if (newQuantity === 0) {
        return prevItems.filter((item) => item.product_id !== productId);
      }

      return prevItems.map((item) =>
        item.product_id === productId
          ? { ...item, quantity: newQuantity }
          : item
      );
    });
  };

  const getItemQuantity = (productId: number): number => {
    const item = cartItems.find((item) => item.product_id === productId);
    return item ? item.quantity : 0;
  };

  const cartCount = cartItems.filter((item) => item.quantity > 0).length;

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.selling_price * (item.quantity || 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        incrementItem,
        decrementItem,
        setItemQuantity,
        getItemQuantity,
        cartCount,
        totalPrice,
        clearCart,
        validationMessages,
        validateCart,
        removeItem,
        isCartValidForCheckout,
        isValidating,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
