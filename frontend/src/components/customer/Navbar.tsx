import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation as useRouteLocation } from "react-router-dom";
import { useCustomerAuth } from "../../context/customer/auth/useCustomerAuth";
import { useLocation } from "../../context/customer/location/useLocation";
import LocationPicker from "./LocationPicker.tsx";
import {
  HiOutlineSearch,
  HiOutlineLocationMarker,
  HiOutlineUserCircle,
  HiOutlineShoppingCart,
  HiChevronDown,
} from "react-icons/hi";
import { GiFruitBowl, GiMilkCarton } from "react-icons/gi";
import { LuCarrot } from "react-icons/lu";
import { IoBagHandleOutline } from "react-icons/io5";
import { useCart } from "../../context/customer/cart/useCart.ts";
import { useCategory } from "../../context/customer/category/useCategory.ts";
import { useSearch } from "../../context/customer/search/useSearch.ts";
import GuestLoginModal from "./GuestLoginModal";
import ProfileDropdown from "./ProfileDropdown";
import { AnimatePresence } from "framer-motion";
import useOnClickOutside from "../../hooks/useOnClickOutside.ts";

const categories = [
  { name: "All", icon: <IoBagHandleOutline size={20} /> },
  { name: "Fruits", icon: <GiFruitBowl size={20} /> },
  { name: "Vegetables", icon: <LuCarrot size={20} /> },
  { name: "Dairy", icon: <GiMilkCarton size={20} /> },
];

interface NavbarProps {
  onCartClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onCartClick }) => {
  const { isAuthenticated, customer } = useCustomerAuth();
  const { cartCount } = useCart();
  const { location, setLocation } = useLocation();
  const { selectedCategory, setSelectedCategory } = useCategory();
  const { searchTerm, setSearchTerm } = useSearch();
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const routeLocation = useRouteLocation();
  const hideCategoryBarOnPages = ["/profile", "/orders"];
  const shouldShowCategoryBar = !hideCategoryBarOnPages.includes(
    routeLocation.pathname
  );

  useOnClickOutside(dropdownRef as React.RefObject<HTMLElement>, () =>
    setIsProfileDropdownOpen(false)
  );

  const handleProfileClick = (e: React.MouseEvent) => {
    if (isAuthenticated) {
      e.preventDefault();
      setIsProfileDropdownOpen((prev) => !prev);
    }
  };
  useEffect(() => {
    if (
      isAuthenticated &&
      customer &&
      customer.address &&
      customer.latitude &&
      customer.longitude
    ) {
      if (!location) {
        setLocation({
          lat: customer.latitude,
          lng: customer.longitude,
          displayName: customer.address,
        });
      }
    }
  }, [isAuthenticated, customer, location, setLocation]);

  const truncateAddress = (address: string, length: number = 30) => {
    if (address.length <= length) return address;
    return address.substring(0, length) + "...";
  };

  const handleLocationClick = () => {
    if (isAuthenticated) {
      setIsLocationPickerOpen(true);
    } else {
      setIsGuestModalOpen(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-shrink-0">
              <div className="flex flex-col md:flex-row md:items-center">
                <Link to="/" className="text-2xl font-bold text-[#387c40]">
                  Farmer Logistics
                </Link>
                <div className="relative md:border-l md:ml-4 md:pl-4 z-50">
                  <button
                    onClick={handleLocationClick}
                    className="flex items-center gap-1 text-sm text-gray-500 font-semibold"
                  >
                    <HiOutlineLocationMarker />
                    <span className="truncate max-w-[150px] md:max-w-[250px] text-gray-700">
                      {location
                        ? truncateAddress(location.displayName, 40)
                        : "Set Location"}
                    </span>
                    <HiChevronDown />
                  </button>

                  <LocationPicker
                    isOpen={isLocationPickerOpen}
                    onClose={() => setIsLocationPickerOpen(false)}
                  />
                </div>
              </div>
            </div>
            <div className="flex-1 max-w-2xl hidden md:block">
              <div className="relative">
                <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search your favorite products, e.g., Onions"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-[#387c40]"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 md:gap-6 shrink-0">
              <div className="relative" ref={dropdownRef}>
                <Link
                  to={isAuthenticated ? "/profile" : "/login"}
                  className="flex flex-col items-center text-xs md:text-sm font-medium text-gray-700 hover:text-[#387c40]"
                  onClick={handleProfileClick}
                >
                  <HiOutlineUserCircle size={24} />
                  <span>
                    {isAuthenticated && customer
                      ? customer.is_guest_user
                        ? customer.customer_code
                        : customer.first_name
                      : "Login"}
                  </span>
                </Link>
                <AnimatePresence>
                  {isAuthenticated && isProfileDropdownOpen && (
                    <ProfileDropdown
                      onClose={() => setIsProfileDropdownOpen(false)}
                    />
                  )}
                </AnimatePresence>
              </div>
              <button
                onClick={onCartClick}
                className="relative flex flex-col items-center text-xs md:text-sm font-medium text-gray-700 hover:text-[#387c40]"
              >
                <HiOutlineShoppingCart size={24} />
                <span>Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#387c40] text-xs font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
          <div className="mt-3 md:hidden">
            <div className="relative">
              <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Onions, Apples..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:ring-1 focus:ring-[#387c40]"
              />
            </div>
          </div>
        </div>
        {shouldShowCategoryBar && (
          <div className="border-t border-gray-200">
            <nav className="container mx-auto px-4 flex items-center gap-6 overflow-x-auto py-2">
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === category.name
                      ? "bg-green-100 text-[#387c40]"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {category.icon}
                  {category.name}
                </button>
              ))}
            </nav>
          </div>
        )}
      </header>
      <GuestLoginModal
        isOpen={isGuestModalOpen}
        onClose={() => setIsGuestModalOpen(false)}
      />
    </>
  );
};

export default Navbar;
