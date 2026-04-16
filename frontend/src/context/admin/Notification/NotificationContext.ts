import { createContext } from "react";

export interface NotificationContextType {
  hasNewOrder: boolean;
  setHasNewOrder: (hasNew: boolean) => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
