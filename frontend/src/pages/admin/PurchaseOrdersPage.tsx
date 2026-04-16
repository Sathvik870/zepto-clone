import React, { useState, useEffect, useMemo } from "react";
import api from "../../api";
import { useAlert } from "../../context/common/AlertContext";
import {
  HiPlus,
  HiChevronDown,
  HiChevronUp,
  HiSearch,
  HiArrowSmUp,
  HiArrowSmDown,
} from "react-icons/hi";
import AddPurchaseOrderModal from "../../components/admin/AddPurchaseOrderModal";

interface PurchaseOrder {
  purchase_id: number;
  purchase_code: string;
  purchase_date: string;
  supplier_name: string;
  supplier_contact: string;
  total_amount: string;
}

interface PurchaseOrderItem {
  item_id: number;
  product_id: number;
  purchase_quantity: number;
  purchase_price: number;
  product_code: string;
  product_name: string;
  product_category: string;
  unit_type: string;
}

type SortConfig = {
  key: keyof PurchaseOrder;
  direction: "ascending" | "descending";
} | null;

const PurchaseOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const { showAlert } = useAlert();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get<PurchaseOrder[]>("/api/admin/purchase-orders");
      setOrders(response.data);
    } catch (error) {
      showAlert("Failed to load purchase orders.", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredAndSortedOrders = useMemo(() => {
    let sortableOrders = [...orders];
    if (searchTerm) {
      const lowercasedFilter = searchTerm.toLowerCase();
      sortableOrders = sortableOrders.filter((order) => {
        const formattedDate = new Date(order.purchase_date).toLocaleString(
          "en-IN"
        );
        const codeMatch = (order.purchase_code || "")
          .toLowerCase()
          .includes(lowercasedFilter);
        const supplierMatch = (order.supplier_name || "")
          .toLowerCase()
          .includes(lowercasedFilter);
        const dateMatch = formattedDate
          .toLowerCase()
          .includes(lowercasedFilter);
        const amountMatch = (order.total_amount || "").includes(
          lowercasedFilter
        );
        return codeMatch || supplierMatch || dateMatch || amountMatch;
      });
    }

    if (sortConfig !== null) {
      sortableOrders.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        let comparison = 0;
        if (sortConfig.key === "total_amount") {
          comparison = Number(aValue) - Number(bValue);
        } else if (sortConfig.key === "purchase_date") {
          comparison = new Date(aValue).getTime() - new Date(bValue).getTime();
        } else {
          comparison = String(aValue || "").localeCompare(String(bValue || ""));
        }

        return sortConfig.direction === "ascending" ? comparison : -comparison;
      });
    }

    return sortableOrders;
  }, [orders, searchTerm, sortConfig]);

  const requestSort = (key: keyof PurchaseOrder) => {
    if (!sortConfig || sortConfig.key !== key) {
      setSortConfig({ key, direction: "ascending" });
    } else if (sortConfig.direction === "ascending") {
      setSortConfig({ key, direction: "descending" });
    } else {
      setSortConfig(null);
    }
  };

  const toggleAccordion = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Purchase Orders</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#144a31] focus:text-[#144a31]" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border-2 border-[#144a31] rounded-full focus:outline-none focus:ring-2 focus:ring-[#144a31]"
            />
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex gap-2 text-lg cursor-pointer text-white font-semibold bg-gradient-to-r from-[#144a31] to-[#387c40] px-6 py-2.5 rounded-full border border-[#144a31] hover:scale-105 duration-200 justify-center items-center"
          >
            <HiPlus size={20} /> Add Purchase Order
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-[#387c40] border-b-2 border-gray-200">
            <tr>
              <SortableHeader
                title="Purchase Code"
                sortKey="purchase_code"
                sortConfig={sortConfig}
                requestSort={requestSort}
              />
              <SortableHeader
                title="Supplier"
                sortKey="supplier_name"
                sortConfig={sortConfig}
                requestSort={requestSort}
              />
              <SortableHeader
                title="Supplier Contact"
                sortKey="supplier_contact"
                sortConfig={sortConfig}
                requestSort={requestSort}
              />
              <SortableHeader
                title="Date"
                sortKey="purchase_date"
                sortConfig={sortConfig}
                requestSort={requestSort}
              />
              <SortableHeader
                title="Total"
                sortKey="total_amount"
                sortConfig={sortConfig}
                requestSort={requestSort}
                isRightAligned
              />
              <th className="px-6 py-4 w-[5%]"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center p-8 text-xl text-gray-600"
                >
                  Loading orders...
                </td>
              </tr>
            ) : filteredAndSortedOrders.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center p-8 text-xl text-gray-600"
                >
                  No purchase orders found.
                </td>
              </tr>
            ) : (
              filteredAndSortedOrders.map((order) => (
                <AccordionRow
                  key={order.purchase_id}
                  order={order}
                  isExpanded={expandedId === order.purchase_id}
                  toggleExpand={() => toggleAccordion(order.purchase_id)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddPurchaseOrderModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaveSuccess={fetchOrders}
      />
    </div>
  );
};

const SortableHeader: React.FC<{
  title: string;
  sortKey: keyof PurchaseOrder;
  sortConfig: SortConfig;
  requestSort: (key: keyof PurchaseOrder) => void;
  isRightAligned?: boolean;
}> = ({ title, sortKey, sortConfig, requestSort, isRightAligned }) => {
  const isSorted = sortConfig?.key === sortKey;
  const directionIcon = isSorted ? (
    sortConfig?.direction === "ascending" ? (
      <HiArrowSmUp />
    ) : (
      <HiArrowSmDown />
    )
  ) : null;

  return (
    <th
      className={`px-6 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider cursor-pointer select-none ${
        isRightAligned ? "text-right" : ""
      }`}
      onClick={() => requestSort(sortKey)}
    >
      <div
        className={`flex items-center gap-2 ${
          isRightAligned ? "justify-end" : ""
        }`}
      >
        {title}
        {directionIcon}
      </div>
    </th>
  );
};

const AccordionRow: React.FC<{
  order: PurchaseOrder;
  isExpanded: boolean;
  toggleExpand: () => void;
}> = ({ order, isExpanded, toggleExpand }) => {
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const { showAlert } = useAlert();

  const fetchItems = async () => {
    if (isExpanded && items.length === 0) {
      setLoadingItems(true);
      try {
        const response = await api.get<PurchaseOrderItem[]>(
          `/api/admin/purchase-orders/${order.purchase_code}/details`
        );
        setItems(response.data);
      } catch (error) {
        showAlert("Failed to load order items.", "error");
        console.error(error);
      } finally {
        setLoadingItems(false);
      }
    }
  };

  useEffect(() => {
    fetchItems();
  }, [isExpanded]);

  const formattedDate = new Date(order.purchase_date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <>
      <tr
        className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
        onClick={toggleExpand}
      >
        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">
          {order.purchase_code}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
          {order.supplier_name}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
          {order.supplier_contact}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
          {formattedDate}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-[#144a31]">
          ₹{Number(order.total_amount).toFixed(2)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right">
          {isExpanded ? (
            <HiChevronUp size={24} className="text-gray-500" />
          ) : (
            <HiChevronDown size={24} className="text-gray-500" />
          )}
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={5} className="p-4 bg-gray-100">
            {loadingItems ? (
              <p className="text-center p-4">Loading items...</p>
            ) : (
              <table className="min-w-full">
                <thead className="bg-[#387c40]">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-white uppercase">
                      Code
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-white uppercase">
                      Product
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-white uppercase">
                      Qty
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-white uppercase">
                      Rate
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-white uppercase">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.item_id}>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {item.product_code}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {item.product_name}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {item.purchase_quantity} {item.unit_type}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        ₹{Number(item.purchase_price).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-sm font-semibold text-green-800">
                        ₹
                        {(item.purchase_quantity * Number(item.purchase_price)).toFixed(
                          2
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </td>
        </tr>
      )}
    </>
  );
};

export default PurchaseOrdersPage;
