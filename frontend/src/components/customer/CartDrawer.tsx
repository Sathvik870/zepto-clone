import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "../../context/customer/location/useLocation";
import { useCustomerAuth } from "../../context/customer/auth/useCustomerAuth";
import { useCart } from "../../context/customer/cart/useCart";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineReceiptTax,
  HiChevronLeft,
  HiOutlineShoppingCart,
  HiOutlineRefresh,
} from "react-icons/hi";
import CartItemCard from "./CartItemCard";
import DeliveryLocation from "./DeliveryLocation";
import LocationPicker from "./LocationPicker";
import { useAlert } from "../../context/common/AlertContext";
import api from "../../api";
import { useProducts } from "../../context/customer/product/useProducts";
import PaymentMethodSelector from "./PaymentMethodSelector";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const BillSummary: React.FC = () => {
  const { cartItems, validationMessages } = useCart();
  const validCartItems = cartItems.filter(
    (item) => !validationMessages[item.product_id]
  );
  const itemTotal = validCartItems.reduce(
    (total, item) => total + item.selling_price * item.quantity,
    0
  );

  const deliveryFee = 50.0;
  const toPay = itemTotal + deliveryFee;
  return (
    <div className="p-4 bg-white rounded-lg  border border-gray-200">
      <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
        <HiOutlineReceiptTax /> Bill Summary
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <p className="text-gray-600">Item Total</p>
          <p className="font-semibold">₹{itemTotal.toFixed(2)}</p>
        </div>
        <div className="flex justify-between">
          <p className="text-gray-600">Delivery Fee</p>
          <p className="font-semibold">₹{deliveryFee.toFixed(2)}</p>
        </div>
        <hr className="my-2 border-gray-200" />
        <div className="flex justify-between text-base font-bold">
          <p>To Pay</p>
          <p>₹{toPay.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const {
    cartItems,
    cartCount,
    clearCart,
    validateCart,
    isCartValidForCheckout,
    isValidating,
  } = useCart();
  const { customer } = useCustomerAuth();
  const { location } = useLocation();
  const { showAlert } = useAlert();
  const { fetchProducts } = useProducts();
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const isProceedDisabled = !location || !isCartValidForCheckout;
  const locationButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && cartItems.length > 0) {
      validateCart();
    }
  }, [isOpen]);

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    try {
      const response = await api.post(
        "/api/customer/orders",
        {
          cartItems: cartItems,
          paymentMethod: paymentMethod,
          customer_details: {
            ...customer,
            delivery_charges: 50.0,
          },
        },
        {
          responseType: "blob",
        }
      );
      console.log(customer);
      if (response.headers["content-type"] === "application/pdf") {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;

        let filename = "invoice.pdf";
        const contentDisposition = response.headers["content-disposition"];
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch && filenameMatch.length === 2)
            filename = filenameMatch[1];
        }
        link.setAttribute("download", filename);

        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        showAlert("Order placed and invoice downloaded!", "success");
        clearCart();
        onClose();
        fetchProducts();
      } else {
        const responseText = await (response.data as Blob).text();
        const responseJson = JSON.parse(responseText);
        showAlert(responseJson.message, "warning");
        clearCart();
        onClose();
        fetchProducts();
      }
    } catch (error: any) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.toString() === "[object Blob]"
      ) {
        const errorBlobText = await (error.response.data as Blob).text();
        try {
          const errorJson = JSON.parse(errorBlobText);
          const errorMessage = errorJson.message || "Failed to place order.";
          showAlert(errorMessage, "error");
          if (errorMessage.toLowerCase().includes("insufficient stock")) {
            validateCart();
          }
        } catch (e) {
          console.error("Failed to parse error response:", e);
          showAlert("An unknown error occurred.", "error");
        }
      } else {
        const errorMessage =
          error.response?.data?.message || "Failed to place order.";
        showAlert(errorMessage, "error");
        if (errorMessage.toLowerCase().includes("insufficient stock")) {
          validateCart();
        }
      }
    } finally {
      setIsPlacingOrder(false);
    }
  };
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-[#ffffff00] hidden md:block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            <motion.div
              className="fixed top-0 right-0 h-full w-full md:w-[400px] bg-gray-50 z-50 flex flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
            >
              <header className="relative flex-shrink-0 flex items-center justify-center p-4 border-b bg-white border-gray-200">
                <button
                  onClick={onClose}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-black"
                >
                  <HiChevronLeft size={24} />
                </button>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <HiOutlineShoppingCart className="text-gray-700" />
                  Cart ({cartCount})
                </h2>
              </header>
              <div className="flex-grow p-4 overflow-y-auto space-y-4">
                <div ref={locationButtonRef} className="relative">
                  <DeliveryLocation
                    onSelectLocationClick={() => setIsLocationPickerOpen(true)}
                  />

                  <LocationPicker
                    isOpen={isLocationPickerOpen}
                    onClose={() => setIsLocationPickerOpen(false)}
                  />
                </div>
                {cartItems.length > 0 && (
                  <div className="flex justify-end">
                    <button
                      onClick={clearCart}
                      className="text-sm font-semibold text-red-600 hover:text-red-800"
                    >
                      Clear Cart
                    </button>
                  </div>
                )}
                {isValidating ? (
                  <div className="flex flex-col items-center justify-center pt-20 text-gray-500">
                    <HiOutlineRefresh className="animate-spin h-8 w-8 mb-2" />
                    <p>Validating your cart...</p>
                  </div>
                ) : cartItems.length > 0 ? (
                  <div className="bg-white rounded-lg divide-y divide-gray-200 px-4">
                    {cartItems.map((item) => (
                      <CartItemCard key={item.product_id} item={item} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center pt-20 text-gray-500">
                    Your cart is empty.
                  </div>
                )}
              </div>
              {cartItems.length > 0 && !isValidating && (
                <footer className="flex-shrink-0 p-4 space-y-4 border-t border-gray-200 bg-white">
                  <BillSummary />
                  <PaymentMethodSelector
                    selectedMethod={paymentMethod}
                    onSelectMethod={setPaymentMethod}
                  />
                  <button
                    disabled={isProceedDisabled || isPlacingOrder}
                    onClick={handlePlaceOrder}
                    className="w-full bg-[#387c40] text-white font-bold py-3 rounded-lg hover:bg-[#144a31] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isPlacingOrder
                      ? "Placing Order..."
                      : !location
                      ? "Select Address to Proceed"
                      : !isCartValidForCheckout
                      ? "Please Resolve Stock Issues"
                      : "Place Order"}
                  </button>
                </footer>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default CartDrawer;
