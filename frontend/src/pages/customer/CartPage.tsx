import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CartDrawer from "../../components/customer/CartDrawer";
import ShoppingPage from "./ShoppingPage";

const CartPage: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setIsDrawerOpen(true);
  }, []);

  const handleClose = () => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      navigate("/");
    }, 300);
  };

  return (
    <>
      <div className="hidden md:block">
        <ShoppingPage />
      </div>
      <div className="block md:hidden"></div>
      <CartDrawer isOpen={isDrawerOpen} onClose={handleClose} />
    </>
  );
};

export default CartPage;
