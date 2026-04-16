import { createContext} from "react";

export interface Customer {
  customer_id: number;
  customer_code: string;
  username: string | null;
  gender: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  is_guest_user: boolean;
  landmark: string | null;
}

export interface CustomerAuthContextType {
  isAuthenticated: boolean;
  customer: Customer | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout:  (clearCart: () => void) => void;
}

export const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);