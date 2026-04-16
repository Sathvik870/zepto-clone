import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { useSocket } from "../../context/common/socket/useSocket";
import api from "../../api";
import { HiEye } from "react-icons/hi";
import OrderItemsModal from "../../components/admin/OrderItemsModal";
import { useAlert } from "../../context/common/AlertContext";
import SalesOrderStatusRenderer from "../../components/admin/SalesOrderStatusRenderer";
import { useNotification } from "../../context/admin/Notification/useNotification.ts";

export interface Order {
  sales_order_id: number;
  invoice_code: string;
  customer_name: string;
  total_amount: number;
  delivery_status: string;
  payment_status: string;
  payment_method: string;
  order_date: string;
  shipping_address: string;
  phone_number: string;
  order_items: [];
  isNew?: boolean;
}

const gridStyles = `
  .ag-cell.new-invoice-highlight {
    background-color: #fecaca; /* A light red color */
    font-weight: bold;
    color: #b91c1c; /* Darker red text */
    animation: pulse-bg 2s infinite;
  }

  @keyframes pulse-bg {
    0% { background-color: #fecaca; }
    50% { background-color: #fee2e2; }
    100% { background-color: #fecaca; }
  }
  .custom-ag-theme .ag-header {
    background-color: #387c40;
    border-bottom: 2px solid #387c40;
  }

  .custom-ag-theme .ag-header-cell {
    color: white;
  }

  .custom-ag-theme .ag-header-cell-label {
    font-weight: 600;
    font-size: 15px;
  }
  .custom-ag-theme .ag-header-icon {
    color: white;
  }
  .custom-ag-theme .ag-header-icon {
    color: white;
  }
`;

const SalesOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const { showAlert } = useAlert();
  const socket = useSocket();
  const { setHasNewOrder } = useNotification();
  const [selectedOrderItems, setSelectedOrderItems] = useState<{
    items: [];
    id: number;
  } | null>(null);
  const gridRef = useRef<AgGridReact<Order>>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.get("/api/admin/sales-orders");
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders", error);
    }
  }, []);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    const performUpdate = async () => {
      try {
        await api.put(`/api/admin/sales-orders/${orderId}/status`, {
          status: newStatus,
        });
        const rowNode = gridRef.current?.api.getRowNode(String(orderId));
        if (rowNode && rowNode.data) {
          rowNode.setData({ ...rowNode.data, delivery_status: newStatus });
        }
      } catch (error: any) {
        showAlert(
          error.response?.data?.message || "Failed to update status.",
          "error"
        );
      }
    };
    if (newStatus === "Cancelled") {
      showAlert("Cancel order and restock items?", "warning", performUpdate);
    } else {
      performUpdate();
    }
  };

  useEffect(() => {
    setHasNewOrder(false);
  }, [setHasNewOrder]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (newOrder: Order) => {
      gridRef.current?.api.applyTransactionAsync({
        add: [{ ...newOrder, isNew: true }],
        addIndex: 0,
      });
    };

    socket.on("new_order", handleNewOrder);

    return () => {
      socket.off("new_order", handleNewOrder);
    };
  }, [socket]);

  const handleViewItems = (orderData: Order) => {
    setSelectedOrderItems({
      items: orderData.order_items,
      id: orderData.sales_order_id,
    });
    const rowNode = gridRef.current?.api.getRowNode(
      String(orderData.sales_order_id)
    );

    if (rowNode && rowNode?.data?.isNew) {
      rowNode.setData({ ...rowNode.data, isNew: false });
    }
  };

  const columnDefs = useMemo<ColDef<Order>[]>(
    () => [
      {
        field: "invoice_code",
        headerName: "Inv Code",
        flex: 0.9,
        cellClassRules: {
          'new-invoice-highlight': (params) => !!params.data?.isNew,
        },
      },
      {
        field: "customer_name",
        headerName: "Customer Name",
        flex: 1.3,
      },
      {
        field: "phone_number",
        headerName: "Phone",
        flex: 0.9,
      },
      {
        field: "shipping_address",
        headerName: "Address",
        tooltipField: "shipping_address",
        flex: 1,
      },
      {
        headerName: "Items",
        flex: 0.8,
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },

        cellRenderer: (params: ICellRendererParams<Order>) => {
          if (!params.data) return null;
          return (
            <button
              onClick={() => handleViewItems(params.data!)}
              className="flex items-center gap-1 text-sm font-bold text-[#387c40] hover:text-[#144a31] bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full transition-colors"
            >
              <HiEye /> {params.data.order_items?.length || 0} Items
            </button>
          );
        },
      },
      {
        field: "total_amount",
        headerName: "Amount",
        flex: 0.8,
        valueFormatter: (p) => `₹${Number(p.value).toFixed(2)}`,
      },
      {
        field: "payment_method",
        headerName: "Payment Method",
        flex: 1.2,
        valueFormatter: ({ value }) =>
          value === "COD" ? "Cash on Delivery" : value,
      },
      {
        headerName: "Payment",
        flex: 1,
        cellRenderer: (params: ICellRendererParams<Order>) => {
          if (!params.data) return null;
          const { payment_status } = params.data;

          const statusText = `${payment_status}`;
          let colorClasses = "";
          if (payment_status === "Paid") {
            colorClasses = "bg-green-100 text-green-800";
          } else if (payment_status === "Unpaid") {
            colorClasses = "bg-red-100 text-red-800";
          } else {
            colorClasses = "bg-yellow-100 text-yellow-800";
          }
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses}`}
            >
              {statusText}
            </span>
          );
        },
      },
      {
        field: "delivery_status",
        headerName: "Order Status",
        width: 160,
        cellRenderer: SalesOrderStatusRenderer,
        cellRendererParams: { onStatusChange: handleStatusChange },
      },
    ],
    []
  );

  const getRowId = useCallback((params: any) => params.data.sales_order_id, []);

  return (
    <>
      <style>{gridStyles}</style>
      <div className="p-2">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Sales Orders</h1>
        </div>

        <div
          className="ag-theme-alpine custom-ag-theme"
          style={{ height: 600, width: "100%" }}
        >
          <AgGridReact<Order>
            ref={gridRef}
            rowData={orders}
            columnDefs={columnDefs}
            defaultColDef={{
              sortable: true,
              filter: true,
              resizable: true,
              cellStyle: { fontWeight: 600 },
            }}
            getRowId={getRowId}
            pagination={true}
            paginationPageSize={1000}
            paginationPageSizeSelector={[1000, 2000, 5000]}
          />
        </div>

        <OrderItemsModal
          isOpen={!!selectedOrderItems}
          onClose={() => setSelectedOrderItems(null)}
          items={selectedOrderItems?.items || []}
          orderId={selectedOrderItems?.id || 0}
        />
      </div>
    </>
  );
};

export default SalesOrdersPage;
