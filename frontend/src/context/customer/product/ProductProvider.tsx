import { useState, type ReactNode, useCallback, useEffect } from "react";
import api from "../../../api";
import type { ProductWithImage } from "../../../pages/admin/ProductsPage";
import { ProductContext } from "./ProductContext";

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<ProductWithImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading((prev) => (!prev ? true : prev));
    try {
      const response = await api.get<ProductWithImage[]>(
        "/api/public/products/saleable"
      );
      setProducts(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to load products.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <ProductContext.Provider
      value={{ products, fetchProducts, loading, error }}
    >
      {children}
    </ProductContext.Provider>
  );
};
