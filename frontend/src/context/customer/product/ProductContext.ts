import { createContext } from "react";
import type { ProductWithImage } from "../../../pages/admin/ProductsPage";

export interface ProductContextType {
  products: ProductWithImage[];
  fetchProducts: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const ProductContext = createContext<ProductContextType | undefined>(undefined);