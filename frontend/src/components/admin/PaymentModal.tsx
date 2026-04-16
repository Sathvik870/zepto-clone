import React, { useState, useMemo, useEffect } from "react";
import { HiX } from "react-icons/hi";
import api from "../../api";
import { useAlert } from "../../context/common/AlertContext";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  invoice: any;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSaveSuccess,
  invoice,
}) => {

  const { amountDue, totalAmount } = useMemo(() => {
    if (!invoice) return { amountDue: 0, totalAmount: 0 };
    const total = parseFloat(invoice.total_amount) || 0;
    const paid = parseFloat(invoice.amount_paid) || 0;
    return {
      amountDue: parseFloat((total - paid).toFixed(2)),
      totalAmount: total,
    };
  }, [invoice]);

  const [amountPaidNow, setAmountPaidNow] = useState("");

  useEffect(() => {
    if (isOpen && invoice) {
      setAmountPaidNow(amountDue > 0 ? amountDue.toFixed(2) : "");
    }
  }, [isOpen, invoice, amountDue]);

  useEffect(() => {
    if (isOpen && invoice) {
      setAmountPaidNow(amountDue > 0 ? amountDue.toFixed(2) : '');
    }
  }, [isOpen, invoice, amountDue]);


  const { showAlert } = useAlert();

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value === '' || value === '.') {
        setAmountPaidNow(value);
        return;
    }

    const numericValue = parseFloat(value);
    
    if (isNaN(numericValue) || numericValue < 0) {
        return;
    }
    
    if (numericValue > amountDue) {
        setAmountPaidNow(amountDue.toFixed(2));
    } else {
        setAmountPaidNow(value);
    }
  };

  const numericAmountPaidNow = parseFloat(amountPaidNow);
  const isSaveDisabled =
    isNaN(numericAmountPaidNow) ||
    numericAmountPaidNow <= 0 ||
    numericAmountPaidNow > amountDue;

  if (!isOpen || !invoice) return null;

  const handleSubmit = async () => {
    if (isSaveDisabled) return;
    try {
      await api.put(`/api/admin/invoices/${invoice.invoice_id}/payment`, {
        amount_paid_now: numericAmountPaidNow,
      });
      showAlert("Payment updated successfully!", "success");
      onSaveSuccess();
      onClose();
    } catch (error: any) {
      showAlert(
        error.response?.data?.message || "Failed to update payment.",
        "error"
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#ffffffe8]">
      <div className="bg-gray-50 rounded-lg shadow-xl w-full max-w-md">
        <div className="bg-[#387c40] p-4 flex justify-between items-center rounded-t-lg">
          <h3 className="text-lg text-white font-bold">
            Record Payment for {invoice.invoice_code}
          </h3>
          <button className="text-white hover:text-gray-400" onClick={onClose}>
            <HiX size={24} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-lg font-medium text-black">
              Total Invoice Amount : ₹{totalAmount}
            </label>
          </div>
          {amountDue !== 0 && (
            <div>
              <label className="block text-lg font-medium text-red-600">
                Amount Due : {`₹${amountDue.toFixed(2)}`}
              </label>
            </div>
          )}
          <div>
            <label className="block text-lg font-medium">
              Enter the amount
            </label>
            <input
              type="number"
              value={amountPaidNow}
              onChange={handleAmountChange}
              placeholder="0.00"
              className="w-full text-lg bg-transparent border-b-2 border-gray-300  pt-2 text-black focus:outline-none focus:border-[#144a31] transition-colors duration-1000 ease-in-out"
            />
          </div>
        </div>
        <div className="p-4 bg-white border-t-2 border-gray-200 flex justify-end gap-4 rounded-b-lg">
          <button
            className="flex-1 sm:flex-none text-base cursor-pointer font-semibold bg-gray-200 text-gray-700 px-7 py-3 rounded-full hover:bg-gray-300 duration-200"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaveDisabled}
            className={`flex gap-3 text-base font-semibold px-7 py-3 rounded-full border justify-center items-center transition-all duration-200
              ${
                !isSaveDisabled
                  ? "bg-gradient-to-r from-[#144a31] to-[#387c40] text-white border-[#144a31] hover:scale-105 cursor-pointer"
                  : "bg-[#618172] text-white cursor-not-allowed"
              }
            `}
          >
            Save Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
