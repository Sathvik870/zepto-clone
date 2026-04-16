import React, { useState, useEffect } from "react";
import api from "../../api";
import { useAlert } from "../../context/common/AlertContext";
import { HiPlus, HiTrash, HiX } from "react-icons/hi";

const labelStyle = "block text-md text-black mb-1 text-left";
const inputStyle =
  "w-full text-base bg-transparent border-b-2 placeholder-gray-500 border-[#144a31] py-2 px-2 text-black focus:outline-none focus:border-[#144a31]";
const primaryButtonStyle =
  "flex gap-3 text-base cursor-pointer text-white font-semibold bg-gradient-to-r from-[#144a31] to-[#387c40] px-7 py-3 rounded-full border border-[#144a31] hover:scale-105 duration-200 justify-center items-center";
const secondaryButtonStyle =
  "flex-1 sm:flex-none text-base cursor-pointer font-semibold bg-gray-200 text-gray-700 px-7 py-3 rounded-full hover:bg-gray-300 duration-200";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
}

interface ProductItem {
  product_id: number;
  product_code: string;
  product_name: string;
  product_category: string;
  unit_type: string;
  cost_price: number;
}

interface OrderItem {
  product_id: number;
  product_code: string;
  product_name: string;
  product_category: string;
  unit_type: string;
  purchase_quantity: number;
  purchase_price: number;
  line_total: number;
}

const AddPurchaseOrderModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onSaveSuccess,
}) => {
  const [supplierName, setSupplierName] = useState("");
  const [supplierContact, setSupplierContact] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<ProductItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const { showAlert } = useAlert();

  const [currentItem, setCurrentItem] = useState({
    product_id: "",
    product_code: "",
    product_name: "",
    product_category: "",
    unit_type: "",
    purchase_quantity: 0,
    purchase_price: 0,
  });

  useEffect(() => {
    if (isOpen) {
      const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
          const response = await api.get("/api/admin/products");
          setAvailableProducts(response.data);
        } catch (error) {
          showAlert("Failed to load product list for purchase order.", "error");
          console.error(error);
        } finally {
          setLoadingProducts(false);
        }
      };
      fetchProducts();
    }
  }, [isOpen]);

  const handleItemChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setCurrentItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleProductSelect = (selectedId: string) => {
    const product = availableProducts.find(
      (p) => String(p.product_id) === selectedId
    );
    if (product) {
      setCurrentItem({
        product_id: String(product.product_id),
        product_code: product.product_code,
        product_name: product.product_name,
        product_category: product.product_category,
        unit_type: product.unit_type,
        purchase_quantity: 1,
        purchase_price: product.cost_price,
      });
    } else {
      setCurrentItem({
        product_id: "",
        product_code: "",
        product_name: "",
        product_category: "",
        unit_type: "",
        purchase_quantity: 0,
        purchase_price: 0,
      });
    }
  };

  const handleAddItem = () => {
    const { product_id, purchase_quantity, purchase_price } = currentItem;
    const numQuantity = Number(purchase_quantity);
    const numPurchasePrice = Number(purchase_price);

    if (!product_id || numQuantity <= 0 || numPurchasePrice < 0) {
      showAlert(
        "Please select a product and enter a valid quantity & price.",
        "warning"
      );
      return;
    }

    const existingItemIndex = orderItems.findIndex(
      (item) => item.product_id === Number(product_id)
    );
    if (existingItemIndex > -1) {
      setOrderItems((prevItems) =>
        prevItems.map((item, index) => {
          if (index === existingItemIndex) {
            const newQuantity = item.purchase_quantity + numQuantity;
            return {
              ...item,
              purchase_quantity: newQuantity,
              purchase_price: numPurchasePrice,
              line_total: newQuantity * numPurchasePrice,
            };
          }
          return item;
        })
      );
    } else {
      const newItem: OrderItem = {
        product_id: Number(product_id),
        product_code: currentItem.product_code,
        product_name: currentItem.product_name,
        product_category: currentItem.product_category,
        unit_type: currentItem.unit_type,
        purchase_quantity: numQuantity,
        purchase_price: numPurchasePrice,
        line_total: numQuantity * numPurchasePrice,
      };
      setOrderItems((prev) => [...prev, newItem]);
    }
    setCurrentItem({
      product_id: "",
      product_code: "",
      product_name: "",
      product_category: "",
      unit_type: "",
      purchase_quantity: 0,
      purchase_price: 0,
    });
  };

  const handleRemoveItem = (productIdToRemove: number) => {
    setOrderItems((prev) =>
      prev.filter((item) => item.product_id !== productIdToRemove)
    );
  };

  const calculateOrderTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.line_total, 0);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderItems.length === 0) {
      showAlert(
        "Please add at least one item to the purchase order.",
        "warning"
      );
      return;
    }
    try {
      const payload = {
        supplier_name: supplierName || null,
        supplier_contact: supplierContact || null,
        items: orderItems.map((item) => ({
          product_id: item.product_id,
          purchase_quantity: item.purchase_quantity,
          purchase_price: item.purchase_price,
        })),
      };
      await api.post("/api/admin/purchase-orders", payload);
      showAlert("Purchase Order submitted successfully!", "success");
      onSaveSuccess();
      onClose();
    } catch (error) {
      showAlert("Failed to create purchase order.", "error");
      console.error(error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#ffffffe8]">
      <div className="bg-[#f7f7f7] rounded-xl shadow-2xl w-full max-w-7xl flex flex-col max-h-[95vh]">
        <div className="relative flex-shrink-0 p-5 bg-[#387c40] rounded-t-xl">
          <h2 className="text-2xl font-bold text-white text-center">
            Add New Purchase Order
          </h2>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full"
          >
            <HiX className="h-6 w-6 text-white hover:text-gray-200 transition-colors" />
          </button>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap items-end gap-x-4 gap-y-5">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="productSelect" className={labelStyle}>
                Product - Code & Name
              </label>
              {loadingProducts ? (
                <p className="pt-2">Loading...</p>
              ) : (
                <select
                  id="productSelect"
                  value={currentItem.product_id}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className={inputStyle}
                >
                  <option value="">Select Product</option>
                  {availableProducts.map((p) => (
                    <option key={p.product_id} value={p.product_id}>
                      {p.product_code} - {p.product_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="w-28">
              <label className={labelStyle}>Category</label>
              <input
                type="text"
                disabled
                value={currentItem.product_category || "-"}
                className={`${inputStyle} bg-gray-100`}
              />
            </div>

            <div className="w-28">
              <label className={labelStyle}>Unit</label>
              <input
                type="text"
                disabled
                value={currentItem.unit_type || "-"}
                className={`${inputStyle} bg-gray-100`}
              />
            </div>

            <div className="w-28">
              <label htmlFor="purchase_quantity" className={labelStyle}>
                Quantity
              </label>
              <input
                id="purchase_quantity"
                name="purchase_quantity"
                type="number"
                min="0"
                value={currentItem.purchase_quantity || ""}
                onChange={handleItemChange}
                className={inputStyle}
              />
            </div>

            <div className="w-28">
              <label htmlFor="purchase_price" className={labelStyle}>
                Purchase Price
              </label>
              <input
                id="purchase_price"
                name="purchase_price"
                type="number"
                value={currentItem.purchase_price || ""}
                onChange={handleItemChange}
                className={inputStyle}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="supplierName" className={labelStyle}>
                Supplier Name{" "}
                <span className="text-md text-gray-500">(Optional)</span>
              </label>
              <input
                id="supplierName"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className={inputStyle}
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <label htmlFor="supplierContact" className={labelStyle}>
                Supplier Contact{" "}
                <span className="text-md text-gray-500">(Optional)</span>
              </label>
              <input
                id="supplierContact"
                value={supplierContact}
                onChange={(e) => setSupplierContact(e.target.value)}
                className={inputStyle}
              />
            </div>

            <div className="flex-shrink-0">
              <button
                type="button"
                onClick={handleAddItem}
                className="h-10 w-10 flex items-center justify-center text-white font-semibold bg-[#144a31] rounded-full hover:bg-[#387c40] transition-colors"
              >
                <HiPlus size={24} />
              </button>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleFinalSubmit}
          className="flex-grow overflow-y-auto p-6"
        >
          {orderItems.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No items added to the order yet.
            </div>
          ) : (
            <div className="overflow-x-auto shadow-sm">
              <table className="min-w-full divide-y-2 divide-[#387c40]">
                <thead className="bg-[#387c40]">
                  <tr>
                    <th className="px-4 py-2 text-left text-md font-medium text-white uppercase">
                      Code
                    </th>
                    <th className="px-4 py-2 text-left text-md font-medium text-white uppercase">
                      Product
                    </th>
                    <th className="px-4 py-2 text-left text-md font-medium text-white uppercase">
                      Category
                    </th>
                    <th className="px-4 py-2 text-left text-md font-medium text-white uppercase">
                      Quantity
                    </th>
                    <th className="px-4 py-2 text-left text-md font-medium text-white uppercase">
                      Rate
                    </th>
                    <th className="px-4 py-2 text-right text-md font-medium text-white uppercase">
                      Total
                    </th>
                    <th className="px-4 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orderItems.map((item) => (
                    <tr key={item.product_id}>
                      <td className="px-4 py-2 whitespace-nowrap text-md">
                        {item.product_code}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-md">
                        {item.product_name}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-md">
                        {item.product_category}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-md">
                        {item.purchase_quantity} {item.unit_type}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-md">
                        ₹{item.purchase_price.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-md font-semibold text-right">
                        ₹{item.line_total.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.product_id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <HiTrash size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-bold">
                    <td colSpan={5} className="px-4 py-3 text-right text-md">
                      ORDER TOTAL:
                    </td>
                    <td className="px-4 py-3 text-right text-md text-[#144a31]">
                      ₹{calculateOrderTotal().toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </form>

        <div className="flex-shrink-0 flex justify-center gap-4 p-4 border-t border-gray-300 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className={secondaryButtonStyle}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleFinalSubmit}
            className={primaryButtonStyle}
          >
            Submit Purchase Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPurchaseOrderModal;
