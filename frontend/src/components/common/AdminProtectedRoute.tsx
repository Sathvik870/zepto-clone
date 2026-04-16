import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "../../context/admin/auth/useAdminAuth";

const AdminProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading Admin Session...</div>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

export default AdminProtectedRoute;