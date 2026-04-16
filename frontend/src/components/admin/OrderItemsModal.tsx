import React from "react";
import { HiX } from "react-icons/hi";

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_type: string;
  selling_unit?: string;
  sell_per_unit_qty?: number;
  price: number;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: OrderItem[];
  orderId: number;
}

const OrderItemsModal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  items,
  orderId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#ffffffe8] p-4">
      <div className="bg-gray-50 rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up">
        <div className="flex justify-between items-center p-4 border-b-2 border-gray-300 bg-[#387c40]">
          <h3 className="text-lg font-bold text-white">
            Items for Order : {orderId}
          </h3>
          <button onClick={onClose} className="text-white hover:text-gray-100">
            <HiX size={24} />
          </button>
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-900 font-medium ">
              <tr>
                <th className="py-2 font-semibold">Product</th>
                <th className="py-2 font-semibold text-center">Unit Size</th>
                <th className="py-2 font-semibold text-center">Quantity</th>
                <th className="py-2 font-semibold text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3 font-medium text-gray-800">
                    {item.product_name}
                  </td>
                  <td className="py-3 text-center text-gray-600">
                    {item.sell_per_unit_qty} {item.selling_unit}
                  </td>
                  <td className="py-3 text-center font-bold text-gray-800">
                    {item.quantity}
                  </td>
                  <td className="py-3 text-right font-mono text-gray-700">
                    ₹{Number(item.price).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-white border-t-2 border-gray-300 text-right">
          <button
            onClick={onClose}
            className="flex-1 sm:flex-none text-base cursor-pointer font-semibold bg-gray-200 text-gray-700 px-7 py-3 rounded-full hover:bg-gray-300 duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderItemsModal;
