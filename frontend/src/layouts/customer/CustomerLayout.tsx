import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../../components/customer/Navbar";
import FloatingCartButton from "../../components/customer/FloatingCartButton";
import CartDrawer from "../../components/customer/CartDrawer";
import GuestLoginModal from "../../components/customer/GuestLoginModal";
import { useCustomerAuth } from "../../context/customer/auth/useCustomerAuth";

const CustomerLayout: React.FC = () => {
  const { isAuthenticated } = useCustomerAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const routeLocation = useLocation();
  const pagesWithoutCategoryBar = ["/profile", "/orders", "/cart"];
  const isShoppingPage = !pagesWithoutCategoryBar.some((path) =>
    routeLocation.pathname.startsWith(path)
  );

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  const handleCartClick = () => {
    if (isAuthenticated) {
      setIsCartOpen(true);
    } else {
      setIsGuestModalOpen(true);
    }
  };

  const closeCart = () => setIsCartOpen(false);
  const closeGuestModal = () => setIsGuestModalOpen(false);
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onCartClick={handleCartClick} />
      <main
        className={`container mx-auto px-4 py-8 ${
          isShoppingPage ? "pt-4" : "pt-8"
        }`}
      >
        <Outlet />
      </main>
      <FloatingCartButton onCartClick={handleCartClick} />
      <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
      <GuestLoginModal isOpen={isGuestModalOpen} onClose={closeGuestModal} />
    </div>
  );
};

export default CustomerLayout;
