import React from "react";
import { useLocation } from "../../context/customer/location/useLocation";
import { HiLocationMarker } from "react-icons/hi";

interface DeliveryLocationProps {
  onSelectLocationClick: () => void;
}

const DeliveryLocation: React.FC<DeliveryLocationProps> = ({
  onSelectLocationClick,
}) => {
  const { location } = useLocation();

  const truncateAddress = (address: string, length: number = 40) => {
    if (address.length <= length) return address;
    return address.substring(0, length) + "...";
  };

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      {location ? (
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 mb-1">
              DELIVERING TO
            </p>
            <div className="flex items-center gap-2">
              <HiLocationMarker className="text-green-600 shrink-0" />
              <p className="text-sm font-semibold text-gray-800">
                {truncateAddress(location.displayName)}
              </p>
            </div>
          </div>
          <button
            onClick={onSelectLocationClick}
            className="text-green-600 font-bold text-sm hover:underline"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">
            Please select a delivery address.
          </p>
          <button
            onClick={onSelectLocationClick}
            className="text-green-600 font-bold text-sm hover:underline whitespace-nowrap"
          >
            Select Address
          </button>
        </div>
      )}
    </div>
  );
};

export default DeliveryLocation;
