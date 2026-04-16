import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import api from "../../../api.ts";
import { CustomerAuthContext, type Customer } from "./CustomerAuthContext.ts";

export const CustomerAuthProvider = ({ children }: { children: ReactNode }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem("customerAuthToken");
      if (token) {
        try {
          const response = await api.get<Customer>(
            "/api/customer/users/profile"
          );
          setCustomer(response.data);
        } catch (error) {
          console.error("Failed to fetch customer profile", error);
          setCustomer(null);
        }
      }
      setIsLoading(false);
    };
    checkAuthStatus();
  }, []);

  const login = async (token: string) => {
    localStorage.setItem("customerAuthToken", token);
    try {
      const response = await api.get<Customer>("/api/customer/users/profile");
      setCustomer(response.data);
    } catch (error) {
      console.error("Failed to fetch customer profile after login", error);
    }
  };

  const logout = (clearCart: () => void) => {
    localStorage.removeItem("customerAuthToken");
    setCustomer(null);
    clearCart(); 
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        isAuthenticated: !!customer,
        customer,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
};
