import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useSocket } from "../../context/common/socket/useSocket";
import { useNotification } from "../../context/admin/Notification/useNotification.ts";
import useSound from "use-sound";
import notificationSound from "../../assets/sounds/notification.mp3";
import Sidebar from "./Sidebar";
import { useSettings } from '../../context/admin/settings/useSettings';

const MainLayout: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const socket = useSocket();
  const { settings } = useSettings();
  const { setHasNewOrder } = useNotification();
  const [play] = useSound(notificationSound);

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);
  
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (newOrder: any) => {
      if (settings.isSoundEnabled) {
        play();
      }

      if (Notification.permission === "granted") {
        new Notification("New Order Received!", {
          body: `Customer: ${newOrder.customer_name}`,
          icon: "/favicon.png",
        });
      }

      setHasNewOrder(true);
    };

    socket.on("new_order", handleNewOrder);

    return () => {
      socket.off("new_order", handleNewOrder);
    };
  }, [socket, settings.isSoundEnabled, play, setHasNewOrder]);
  return (
    <div className="flex h-screen bg-secondary">
      <div
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
      >
        <Sidebar
          isOpen={isSidebarOpen}
        />
      </div>
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-secondary p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
