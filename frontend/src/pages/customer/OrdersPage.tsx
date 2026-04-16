import React, { useState, useEffect } from "react";
import api from "../../api";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";
import {
  HiOutlineCalendar,
  HiOutlineDocumentDownload,
  HiOutlineDocumentText,
} from "react-icons/hi";
import PDFViewerModal from "../../components/customer/PDFViewerModal";
import { useAlert } from "../../context/common/AlertContext"; 
interface DateStatus {
  [date: string]: "paid" | "unpaid" | "partial";
}

interface Invoice {
  invoice_id: number;
  invoice_code: string;
  total_amount: number;
  invoice_date: string;
  sales_order_id: number;
  status: string;
}

const OrdersPage: React.FC = () => {
  const [dateStatus, setDateStatus] = useState<DateStatus>({});
  const { showAlert } = useAlert();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [viewingInvoiceCode, setViewingInvoiceCode] = useState<string | null>(
    null
  );

  const handleCancelOrder = (e: React.MouseEvent, orderId: number) => {
    e.stopPropagation();
    const performCancel = async () => {
      try {
        await api.put(`/api/customer/orders/${orderId}/cancel`);
        if (selectedDate) {
            const dateStr = format(selectedDate, "yyyy-MM-dd");
            const { data } = await api.get<Invoice[]>(`/api/customer/orders/by-date/${dateStr}`);
            setInvoices(data);
        }
        
        showAlert("Order cancelled successfully.", "success");
      } catch (error: any) {
        showAlert(error.response?.data?.message || "Failed to cancel order.", "error");
      }
    };

    showAlert(
      "Are you sure you want to cancel this order? This action cannot be undone.",
      "warning",
      performCancel
    );
  };

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const { data } = await api.get<DateStatus>(
          "/api/customer/orders/summary"
        );
        setDateStatus(data);
      } catch (error) {
        console.error("Failed to fetch order summary", error);
      }
    };
    fetchSummary();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const fetchInvoices = async () => {
        setLoadingInvoices(true);
        try {
          const dateStr = format(selectedDate, "yyyy-MM-dd");
          const { data } = await api.get<Invoice[]>(
            `/api/customer/orders/by-date/${dateStr}`
          );
          setInvoices(data);
        } catch (error) {
          console.error("Failed to fetch invoices for date", error);
          setInvoices([]);
        } finally {
          setLoadingInvoices(false);
        }
      };
      fetchInvoices();
    }
  }, [selectedDate]);

  const handleDownload = async (e: React.MouseEvent, invoiceCode: string) => {
    e.stopPropagation();

    try {
      const response = await api.get(
        `/api/customer/orders/${invoiceCode}/pdf`,
        {
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${invoiceCode}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download invoice", error);
    }
  };

  const modifiers = {
    paid: Object.keys(dateStatus)
      .filter((d) => dateStatus[d] === "paid")
      .map((d) => new Date(d.replace(/-/g, "/"))),

    partial: Object.keys(dateStatus)
      .filter((d) => dateStatus[d] === "partial")
      .map((d) => new Date(d.replace(/-/g, "/"))),

    unpaid: Object.keys(dateStatus)
      .filter((d) => dateStatus[d] === "unpaid")
      .map((d) => new Date(d.replace(/-/g, "/"))),
  };
  const modifiersClassNames = {
    paid: "day-paid",
    partial: "day-partial",
    unpaid: "day-unpaid",
  };

  const customCalendarCss = `
    .rdp {
        --rdp-cell-size: 40px;
        --rdp-accent-color: #387c40 !important; 
        --rdp-background-color: #dcfce7 !important;
    }
    .rdp-nav_button svg {
        stroke: black !important;   /* or white */
    }
    .rdp-day_selected {
        color: #ffffff !important;             /* TEXT COLOR */
        background-color: black !important;  /* SELECTED BG */
    }

    .rdp-nav_button {
        color: #387c40 !important; 
    }
    .day-paid { 
        background-color: #30c82c; 
        color: #ffffff;
        font-weight: bold;
    }
    .day-partial { 
        background-color: #dfe13d; 
        color: #000000;
        font-weight: bold;
    }
    .day-unpaid { 
        background-color: #e85252; 
        color: #ffffff;
        font-weight: bold;
    }
  `;

  const handleDayClick = (day: Date, modifiers: { selected?: boolean }) => {
    if (modifiers.selected) {
      return;
    }
    setSelectedDate(day);
  };

  return (
    <>
      <style>{customCalendarCss}</style>
      <div className="bg-gray-50 min-h-full p-4 md:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">My Orders</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:order-2 bg-white p-4 rounded-2xl shadow-lg self-start lg:w-min lg:justify-self-center">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onDayClick={handleDayClick}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              classNames={{
                day: "rounded-full",
              }}
            />
          </div>
          <div className="lg:col-span-2 lg:order-1 bg-white p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <HiOutlineCalendar className="text-green-700" />
              {selectedDate ? format(selectedDate, "PPP") : "..."}
            </h2>
            <div className="space-y-4 h-[600px] overflow-y-auto pr-2">
              {loadingInvoices ? (
                <p>Loading invoices...</p>
              ) : invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <div
                    key={invoice.invoice_id}
                    className={`border border-gray-200 rounded-lg bg-gray-50 overflow-hidden${
                      invoice.status === "Cancelled"
                        ? "border-red-300 bg-red-50"
                        : ""
                    }`}
                  >
                    {invoice.status === "Cancelled" && (
                      <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                    )}
                    <button
                      onClick={() =>
                        setViewingInvoiceCode(invoice.invoice_code)
                      }
                      className="w-full text-left p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-[#387c40]">
                            {invoice.invoice_code}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {format(new Date(invoice.invoice_date), "p, PPP")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            ₹{Number(invoice.total_amount).toFixed(2)}
                          </p>
                          <p className="text-[#387c40] text-xs font-semibold flex items-center justify-end gap-1">
                            <HiOutlineDocumentText /> View Invoice
                          </p>
                        </div>
                      </div>
                    </button>
                    <div className="border-t-1 border-gray-200 p-2 flex justify-between items-center">
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded 
                                    ${
                                      invoice.status === "Cancelled"
                                        ? "bg-red-200 text-red-800"
                                        : invoice.status === "Delivered"
                                        ? "bg-green-200 text-green-800"
                                        : "bg-blue-100 text-blue-800"
                                    }`}
                      >
                        {invoice.status}
                      </span>
                      <div className="flex gap-2">
                        {(invoice.status === "Confirmed" ||
                          invoice.status === "Packing") && (
                          <button
                            onClick={(e) =>
                              handleCancelOrder(e, invoice.sales_order_id)
                            }
                            className="text-xs font-semibold text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 px-3 py-1 rounded-md transition-colors"
                          >
                            Cancel Order
                          </button>
                        )}
                        <button
                          onClick={(e) =>
                            handleDownload(e, invoice.invoice_code)
                          }
                          className="flex items-center gap-2 text-sm font-semibold text-[#387c40]  p-1 rounded-md transition-colors"
                        >
                          <HiOutlineDocumentDownload size={16} />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center pt-20 text-gray-500">
                  No invoices found for this date.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <PDFViewerModal
        invoiceCode={viewingInvoiceCode}
        onClose={() => setViewingInvoiceCode(null)}
      />
    </>
  );
};

export default OrdersPage;
