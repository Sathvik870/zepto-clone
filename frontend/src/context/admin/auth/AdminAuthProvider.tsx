import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import api from "../../../api.ts";

import { AdminAuthContext, type Admin } from "./AdminAuthContext.ts";

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem("adminAuthToken");
      if (token) {
        try {
          const response = await api.get<Admin>("/api/admin/users/profile");
          setAdmin(response.data);
        } catch (error) {
          console.error("Failed to fetch admin profile", error);
          setAdmin(null);
        }
      }
      setIsLoading(false);
    };
    checkAuthStatus();
  }, []);

  const login = async (token: string) => {
    localStorage.setItem("adminAuthToken", token);
    try {
      const response = await api.get<Admin>("/api/admin/users/profile");
      setAdmin(response.data);
    } catch (error) {
      console.error("Failed to fetch admin profile after login", error);
    }
  };

  const logout = () => {
    localStorage.removeItem("adminAuthToken");
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{ isAuthenticated: !!admin, admin, isLoading, login, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};
