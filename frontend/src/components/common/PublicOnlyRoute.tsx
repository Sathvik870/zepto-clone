import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useCustomerAuth } from "../../context/customer/auth/useCustomerAuth.ts";

const PublicOnlyRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useCustomerAuth();
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Checking session...
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
};

export default PublicOnlyRoute;