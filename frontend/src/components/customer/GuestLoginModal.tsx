import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiX, HiPhone } from "react-icons/hi";
import api from "../../api";
import { useCustomerAuth } from "../../context/customer/auth/useCustomerAuth";
import { Link } from "react-router-dom";

interface GuestLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GuestLoginModal: React.FC<GuestLoginModalProps> = ({ isOpen, onClose }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useCustomerAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post("/api/customer/auth/guest-login", {
        phone_number: phoneNumber,
      });

      await login(response.data.token);
      onClose();
      
    } catch (err: any) {
      if (err.response && err.response.data.isRegisteredUser) {
        setError(err.response.data.message);
      } else {
        setError("An error occurred. Please try again.");
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#ffffff90] p-4">
          <motion.div
            className="bg-white rounded-lg shadow-xl w-full max-w-sm"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
          >
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold text-gray-800">Continue to Cart</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <HiX size={24} />
                </button>
              </div>

              <p className="mt-2 text-gray-600">Please enter your mobile number to proceed.</p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="relative">
                  <HiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#387c40]" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="Enter mobile number"
                    className="w-full h-12 pl-10 pr-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#387c40]"
                    maxLength={10}
                    required
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-600">
                    {error} 
                    {error.includes("already registered") && 
                      <Link to="/login" className="ml-1 font-semibold text-blue-600 hover:underline">
                        Login here.
                      </Link>
                    }
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#387c40] text-white font-bold py-3 rounded-lg hover:bg-[#2f5b30] transition-colors disabled:bg-gray-400"
                >
                  {isLoading ? "Continuing..." : "Confirm"}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GuestLoginModal;