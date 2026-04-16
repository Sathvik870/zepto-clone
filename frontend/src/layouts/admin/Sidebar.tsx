import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/admin/auth/useAdminAuth";
import userAvatar from "../../assets/admin-user.svg";
import {
  HiOutlineHome,
  HiOutlineCalendar,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineShoppingBag,
  HiOutlineDocumentText,
  HiOutlineTruck,
  HiOutlineChartPie,
} from "react-icons/hi";
import { useNotification } from "../../context/admin/Notification/useNotification.ts";

interface SidebarProps {
  isOpen: boolean;
}

const mainLinks = [
  {
    name: "Dashboard",
    path: "/admin/dashboard",
    icon: HiOutlineHome,
  },
  {
    name: "Products",
    path: "/admin/products",
    icon: HiOutlineShoppingBag,
  },
  {
    name: "Purchase orders",
    path: "/admin/purchase-orders",
    icon: HiOutlineCalendar,
  },
  {
    name: "Sales Orders",
    path: "/admin/sales-orders",
    icon: HiOutlineTruck,
  },
  {
    name: "Invoices",
    path: "/admin/invoices",
    icon: HiOutlineDocumentText,
  },
  {
    name: "Daily Totals",
    path: "/admin/daily-totals",
    icon: HiOutlineChartPie,
  },
];

const secondaryLinks = [
  {
    name: "Settings",
    path: "/admin/settings",
    icon: HiOutlineCog,
  },
];

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
}) => {
  const { admin, logout } = useAdminAuth();
  const { hasNewOrder } = useNotification();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  return (
    <aside
      className={`bg-[#f7f7f7] text-black flex flex-col h-full transition-all duration-300 ease-in-out shadow-lg
        ${isOpen ? "w-64" : "w-20"}`}
    >
      <div className="flex items-center h-20 border-b-2 border-[#144a31]  px-6 flex-shrink-0">
        <img src="/logo.svg" alt="Company Logo" className="h-8 w-8" />
        <span
          className={`ml-3 text-xl font-bold whitespace-nowrap overflow-hidden transition-opacity duration-200 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
        >
          Farmer Logistics
        </span>
      </div>

      <nav className="flex-grow px-4 py-6 space-y-2">
        {mainLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) =>
              `relative  text-base flex items-center p-3 rounded-lg transition-colors duration-200 ${
                isActive
                  ? "bg-[#144a3110] text-[#144a31] font-semibold"
                  : "hover:bg-[#387c40] hover:text-[#f7f7f7]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`absolute left-0 h-6 w-1 rounded-r-full bg-[#144a31] transition-opacity ${
                    isActive ? "opacity-100" : "opacity-0"
                  }`}
                ></span>
                <link.icon className="h-6 w-6 flex-shrink-0" />
                <span
                  className={`ml-4 whitespace-nowrap overflow-hidden transition-opacity duration-200 ${
                    isOpen ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {link.name}
                </span>
                {link.name === "Sales Orders" && hasNewOrder && !isActive && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </>
            )}
          </NavLink>
        ))}

        <div className="pt-6 mt-6 border-t border-gray-300 space-y-2">
          {secondaryLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `relative text-base flex items-center p-3 rounded-lg transition-colors duration-200  ${
                  isActive
                    ? "bg-[#144a3110] text-[#144a31] font-semibold"
                    : "hover:bg-[#387c40] hover:text-[#f7f7f7]"
                }`
              }
            >
              <link.icon className="h-6 w-6 flex-shrink-0" />
              <span
                className={`ml-4 whitespace-nowrap overflow-hidden transition-opacity duration-200 ${
                  isOpen ? "opacity-100" : "opacity-0"
                }`}
              >
                {link.name}
              </span>
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="flex-shrink-0 p-4 border-t border-gray-200">
        <div className="flex items-center">
          <img
            src={userAvatar}
            alt="User Avatar"
            className="w-6 h-6 rounded-full"
          />
          <div
            className={`ml-3 whitespace-nowrap overflow-hidden transition-opacity duration-200 ${
              isOpen ? "opacity-100" : "opacity-0"
            }`}
          >
            <p className="font-semibold text-medium">
              {admin ? `${admin.first_name} ${admin.last_name}` : "Admin"}
            </p>
            <p className="text-medium text-gray-500">
              {admin?.role || "Designation"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className={`ml-auto p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-opacity duration-200 ${
              isOpen ? "opacity-100" : "opacity-0"
            }`}
          >
            <HiOutlineLogout className="h-6 w-6" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
