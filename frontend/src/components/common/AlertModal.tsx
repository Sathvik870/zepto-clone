import React, { useEffect } from "react";
import SuccessIcon from "../../assets/success.svg";
import ErrorIcon from "../../assets/error.svg";
import WarningIcon from "../../assets/warning.svg";
export type AlertType = "success" | "error" | "warning";

interface AlertModalProps {
  isOpen: boolean;
  type: AlertType;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
}

const icons = {
  success: <img src={SuccessIcon} className="h-50 w-50" alt="Success" />,
  error: <img src={ErrorIcon} className="h-50 w-50" alt="Error" />,
  warning: <img src={WarningIcon} className="h-50 w-50" alt="Warning" />,
};

const titles = {
  success: "Success!",
  error: "An Error Occurred",
  warning: "Are you sure?",
};

const primaryButtonStyles = {
  warning: "bg-yellow-500 hover:bg-yellow-600 text-white",
};

const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  type,
  title,
  message,
  onClose,
  onConfirm,
}) => {
  useEffect(() => {
    if (isOpen && (type === "success" || type === "error")) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, type, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#ffffffe8]"
      onClick={type !== "warning" ? onClose : undefined}
    >
      <div
        className="flex flex-col items-center text-center max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`flex items-center justify-center h-50 w-50 rounded-full mb-6 bg-[#00000000]`}
        >
          {icons[type]}
        </div>

        <h3 className="text-3xl font-bold text-gray-900 mb-2">
          {title || titles[type]}
        </h3>

        <p className="text-lg text-gray-900 mb-8">{message}</p>

        {type === "warning" && (
          <div className="flex justify-center gap-4">
            <button
              onClick={onClose}
              type="button"
              className="px-8 py-3 text-base font-semibold text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300 focus:outline-none transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              type="button"
              className={`px-8 py-3 text-base font-semibold rounded-full shadow-lg focus:outline-none transition-colors ${primaryButtonStyles[type]}`}
            >
              Confirm
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertModal;
