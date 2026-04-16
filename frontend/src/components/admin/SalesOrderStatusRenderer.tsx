import React from "react";
import type { ICellRendererParams } from "ag-grid-community";
import type { Order } from "../../pages/admin/SalesOrdersPage";

interface StatusRendererProps extends ICellRendererParams<Order> {
  onStatusChange: (orderId: number, newStatus: string) => void;
}

const SalesOrderStatusRenderer: React.FC<StatusRendererProps> = ({
  data,
  onStatusChange,
}) => {
  if (!data) return null;

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onStatusChange(data.sales_order_id, e.target.value);
  };

  const isFinalState =
    data.delivery_status === "Cancelled" ||
    data.delivery_status === "Delivered";

  return (
    <div className="relative inline-block w-full h-full items-center">
      <select
        value={data.delivery_status}
        onChange={handleSelectChange}
        disabled={isFinalState}
        className={`w-full px-3 py-1.5 text-xs font-bold border rounded-lg cursor-pointer focus:outline-none transition-all
          ${
            data.delivery_status === "Delivered"
              ? "bg-green-200 text-green-900 border-green-900 cursor-not-allowed"
              : data.delivery_status === "Cancelled"
              ? "bg-red-200 text-red-900 border-red-900 cursor-not-allowed"
              : data.delivery_status === "In Transit"
              ? "bg-blue-200 text-blue-900 border-blue-900"
              : "bg-yellow-200 text-yellow-900 border-yellow-900"
          }`}
      >
        <option value="Confirmed">Confirmed</option>
        <option value="Packing">Packing</option>
        <option value="In Transit">In Transit</option>
        <option value="Delivered">Delivered</option>
        <option value="Cancelled">Cancelled</option>
      </select>
    </div>
  );
};

export default SalesOrderStatusRenderer;
