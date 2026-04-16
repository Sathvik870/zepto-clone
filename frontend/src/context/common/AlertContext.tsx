import { createContext, useState, useContext } from "react";
import type { ReactNode } from "react";
import AlertModal from "../../components/common/AlertModal";
import type { AlertType } from "../../components/common/AlertModal";

interface AlertState {
  isOpen: boolean;
  type: AlertType;
  message: string;
  title: string;
  onConfirm?: () => void;
}

interface AlertContextType {
  showAlert: (
    message: string,
    type: AlertType,
    onConfirm?: () => void,
    title?: string
  ) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

const initialState: AlertState = {
  isOpen: false,
  type: "success",
  message: "",
  title: "",
  onConfirm: undefined,
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alertState, setAlertState] = useState<AlertState>(initialState);

  const showAlert = (
    message: string,
    type: AlertType,
    onConfirm?: () => void,
    title: string = ""
  ) => {
    setAlertState({
      isOpen: true,
      message,
      type,
      onConfirm,
      title,
    });
  };

  const hideAlert = () => {
    setAlertState(initialState);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <AlertModal
        isOpen={alertState.isOpen}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onClose={hideAlert}
        onConfirm={alertState.onConfirm}
      />
    </AlertContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAlert = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};
