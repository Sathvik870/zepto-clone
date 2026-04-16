import { useState, type ReactNode } from "react";
import { NotificationContext } from "./NotificationContext.ts";

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [hasNewOrder, setHasNewOrder] = useState(false);

  return (
    <NotificationContext.Provider value={{ hasNewOrder, setHasNewOrder }}>
      {children}
    </NotificationContext.Provider>
  );
};
