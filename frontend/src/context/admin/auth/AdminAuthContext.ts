import { createContext } from "react";

export interface Admin {
  user_id: number;
  username: string;
  role: "admin" | "superadmin";
  email: string;
  phone_number: string;
  authorized: boolean;
  first_name: string;
  last_name: string;
}


export interface AdminAuthContextType {
  isAuthenticated: boolean;
  admin: Admin | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}


export const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);
