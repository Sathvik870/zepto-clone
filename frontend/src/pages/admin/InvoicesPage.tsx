import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import api from "../../api";
import { useAlert } from "../../context/common/AlertContext";
import { format } from "date-fns";
import PaymentModal from "../../components/admin/PaymentModal";
import { useAdminAuth } from "../../context/admin/auth/useAdminAuth";

interface Invoice {
  invoice_id: number;
  invoice_code: string;
  customer_name: string;
  customer_code: string;
  phone_number: number;
  total_amount: number;
  amount_paid: number;
  invoice_status: "Upcoming" | "Overdue" | "Paid" | "Partially Paid";
  payment_method: string;
  invoice_date: string;
  due_date: string;
}

const gridStyles = `
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

const InvoicesPage: React.FC = () => {
  const [rowData, setRowData] = useState<Invoice[]>([]);
  const { showAlert } = useAlert();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { admin } = useAdminAuth();
  const isAdminSuper = admin?.role === 'superadmin';

  const fetchInvoices = useCallback(async () => {
    try {
      const response = await api.get<Invoice[]>("/api/admin/invoices");
      setRowData(response.data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      showAlert("Could not load invoice data.", "error");
    }
  }, [showAlert]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const ActionsCellRenderer: React.FC<ICellRendererParams<Invoice>> = ({
    data,
  }) => {
    if (!data) return null;
    const isPayable = data.invoice_status !== "Paid";
    return (
      <div className="flex gap-4 items-center h-full">
        {isPayable && (
          <button
            onClick={() => {
              setSelectedInvoice(data);
              setIsPaymentModalOpen(true);
            }}
            className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-md hover:bg-green-700"
          >
            Record Payment
          </button>
        )}
      </div>
    );
  };

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      cellStyle: { fontSize: "15px", fontWeight: "600" },
    }),
    []
  );

  const columnDefs = useMemo<ColDef<Invoice>[]>(() => {
    const baseCols: ColDef<Invoice>[] = [
      {
        field: "invoice_code",
        headerName: "Invoice Code",
        flex: 1,
      },
      {
        field: "customer_name",
        headerName: "Customer",
        flex: 1,
      },
      {
        field: "phone_number",
        headerName: "Phone Number",
        flex: 1,
      },
      {
        headerName: "Amount Due",
        valueGetter: (p) => {
          const total = parseFloat(String(p.data?.total_amount ?? 0));
          const paid = parseFloat(String(p.data?.amount_paid ?? 0));
          return total - paid;
        },
        valueFormatter: (p) => {
          const numericValue = Number(p.value || 0);
          return `₹${numericValue.toFixed(2)}`;
        },
        flex: 1,
        cellStyle: (p) => {
          const total = parseFloat(String(p.data?.total_amount ?? 0));
          const due = Number(p.value || 0);

          if (due > 0 && due < total) {
            return {
              color: "black",
              fontWeight: "bold",
              backgroundColor: "#f8f76a",
            };
          }

          return due === total
            ? { color: "black", fontWeight: "bold", backgroundColor: "#fa6262", }
            : { color: "black", fontWeight: "bold", backgroundColor: "#8ae695", };
        },
      },
      {
        field: "total_amount",
        headerName: "Total amount",
        valueFormatter: (p) => `₹${Number(p.value || 0).toFixed(2)}`,
        flex: 1,
      },
      {
        field: "invoice_status",
        headerName: "Payment Status",
        flex: 1.2,
        cellRenderer: (params: ICellRendererParams<Invoice>) => {
          if (!params.value) return null;
          const status = params.value;
          const colorClasses =
            status === "Paid"
              ? "bg-green-100 text-green-800"
              : status === "Overdue"
                ? "bg-red-100 text-red-800"
                : status === "Partially Paid"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-yellow-100 text-yellow-800";
          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${colorClasses}`}
            >
              {status}
            </span>
          );
        },
      },
      {
        field: "due_date",
        headerName: "Due Date",
        valueFormatter: (p) => format(new Date(p.value), "PP"),
        flex: 1,
      },
    ];
    if (isAdminSuper) {
      return [
        ...baseCols,
        {
          headerName: "Actions",
          cellRenderer: ActionsCellRenderer,
          flex: 1,
          filter: false,
          sortable: false,
        },
      ];
    }
    return baseCols;
  },
    [isAdminSuper]
  );

  return (
    <div>
      <style>{gridStyles}</style>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Invoices</h1>
      </div>
      <div
        className="ag-theme-alpine custom-ag-theme"
        style={{ height: 600, width: "100%" }}
      >
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          pagination={true}
          paginationPageSize={500}
          paginationPageSizeSelector={[500, 1000, 1500]}
        />
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSaveSuccess={fetchInvoices}
        invoice={selectedInvoice}
      />
    </div>
  );
};

export default InvoicesPage;
