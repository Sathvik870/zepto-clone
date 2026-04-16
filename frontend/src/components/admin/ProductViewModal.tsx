import React, { useState, useEffect } from "react";
import api from "../../api";
import { HiX } from "react-icons/hi";

interface ProductDetails {
  product_code: string;
  product_name: string;
  product_category: string;
  product_description?: string;
  unit_type: string;
  cost_price: number;
  selling_price: number;
  available_quantity: number;
  sell_per_unit_qty: number;
  selling_unit: string;
  imageUrl?: string | null;
}

interface ProductViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number | null;
}

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="py-3 px-2 border-b-2 border-[#144a31]">
    <p className="text-sm font-medium text-gray-800">{label}</p>
    <p className="mt-1 text-lg text-black font-semibold">{value || "N/A"}</p>
  </div>
);

const ProductViewModal: React.FC<ProductViewModalProps> = ({
  isOpen,
  onClose,
  productId,
}) => {
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && productId) {
      const fetchProductDetails = async () => {
        setLoading(true);
        setError(null);
        setProduct(null);
        try {
          const response = await api.get<ProductDetails>(
            `/api/admin/products/${productId}`
          );
          setProduct(response.data);
        } catch (err) {
          setError("Failed to fetch product details.");
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchProductDetails();
    }
  }, [isOpen, productId]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#ffffffe8]"
      onClick={onClose}
    >
      <div
        className="bg-[#f7f7f7] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-4 bg-[#387c40] flex justify-center items-center">
          <h2 className="text-xl font-bold text-white">Product Details</h2>
          <button
            onClick={onClose}
            className="absolute right-4 p-2 rounded-full"
          >
            <HiX className="h-6 w-6 text-white hover:text-gray-200 transition-colors" />
          </button>
        </div>

        {loading && <div className="p-8 text-center">Loading...</div>}
        {error && <div className="p-8 text-center text-red-500">{error}</div>}

        {product && (
          <div className="p-6">
            <div className="w-full flex justify-center mb-6">
              <div className="w-[180px] h-[200px] bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.product_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-500 text-xs text-center">
                    No Image
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <DetailRow label="Product Name" value={product.product_name} />
              <DetailRow label="Product Code" value={product.product_code} />
              <DetailRow label="Category" value={product.product_category} />
              <DetailRow
                label="Total Stock"
                value={`${product.available_quantity} ${product.unit_type}`}
              />
              <DetailRow
                label="Cost Price"
                value={`$${Number(product.cost_price).toFixed(2)} / ${
                  product.unit_type
                }`}
              />
              <DetailRow
                label="Selling Price"
                value={`$${Number(product.selling_price).toFixed(2)} / ${
                  product.unit_type
                }`}
              />
              <DetailRow label="Unit" value={product.unit_type} />
              <DetailRow
                label="Description"
                value={product.product_description}
              />
              <DetailRow label="Selling Unit" value={product.selling_unit} />
              <DetailRow
                label="Sell Per Unit Quantity"
                value={product.sell_per_unit_qty}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductViewModal;
