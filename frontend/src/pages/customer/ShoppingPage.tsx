import React, { useMemo } from "react";
import ProductCard from "../../components/customer/ProductCard";
import { useCategory } from "../../context/customer/category/useCategory.ts";
import { useSearch } from "../../context/customer/search/useSearch.ts";
import { useDebounce } from "use-debounce";
import { useProducts } from "../../context/customer/product/useProducts.ts";
import { calculateMaxCartableQuantity } from "../../utils/unitConverter";

const ShoppingPage: React.FC = () => {
  const { selectedCategory } = useCategory();
  const { products, loading, error } = useProducts();
  const { searchTerm } = useSearch();
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const categoryMatch =
        selectedCategory === "All" ||
        product.product_category === selectedCategory;
      const searchMatch =
        !debouncedSearchTerm ||
        product.product_name
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase());
      return categoryMatch && searchMatch;
    });
    return filtered.sort((a, b) => {
      const maxA = calculateMaxCartableQuantity(
        a.saleable_quantity,
        a.unit_type,
        a.sell_per_unit_qty!,
        a.selling_unit!
      );
      const isStockA = a.saleable_quantity > 0 && maxA >= 1 ? 1 : 0;
      const maxB = calculateMaxCartableQuantity(
        b.saleable_quantity,
        b.unit_type,
        b.sell_per_unit_qty!,
        b.selling_unit!
      );
      const isStockB = b.saleable_quantity > 0 && maxB >= 1 ? 1 : 0; 
      return isStockB - isStockA;
    });

  }, [products, selectedCategory, debouncedSearchTerm]);

  if (loading) {
    return <div className="text-center p-10">Loading products...</div>;
  }
  if (error) {
    return <div className="text-center p-10 text-red-500">{error}</div>;
  }

  return (
    <div>
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.product_id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center p-10 text-gray-500">No products found.</div>
      )}
    </div>
  );
};

export default ShoppingPage;
