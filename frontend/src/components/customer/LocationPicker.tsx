//LocationPicker.tsx
import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L, { LatLng } from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiX,
  HiLocationMarker,
  HiSearch,
  HiOutlineLocationMarker,
} from "react-icons/hi";
import { useLocation } from "../../context/customer/location/useLocation";
import { useAlert } from "../../context/common/AlertContext";
import { useDebounce } from "use-debounce";
import { useCustomerAuth } from "../../context/customer/auth/useCustomerAuth";
import Tooltip from "../common/Tooltip";
import api from "../../api";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
}

const MapEvents: React.FC<{ onPositionChange: (pos: LatLng) => void }> = ({
  onPositionChange,
}) => {
  const map = useMap();
  useEffect(() => {
    onPositionChange(map.getCenter());
  }, []);

  useMapEvents({
    dragend() {
      onPositionChange(map.getCenter());
    },
  });
  return null;
};

const LocationPicker: React.FC<LocationPickerProps> = ({ isOpen, onClose }) => {
  const { location, setLocation } = useLocation();
  const { showAlert } = useAlert();
  const { isAuthenticated } = useCustomerAuth();
  const [showLoginTooltip, setShowLoginTooltip] = useState(false);
  const [initialAddress, setInitialAddress] = useState<string | null>(null);
  const initialCenter: [number, number] = location
    ? [location.lat, location.lng]
    : [13.0827, 80.2707];

  const [mapCenter, setMapCenter] = useState<[number, number]>(initialCenter);
  const [currentAddress, setCurrentAddress] = useState(
    "Move the map to select your location"
  );
  const [addressDetails, setAddressDetails] = useState({ city: "", state: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
  const mapRef = useRef<L.Map>(null);
  const isConfirmDisabled =
    !currentAddress ||
    currentAddress === initialAddress ||
    currentAddress.includes("Fetching");
  useEffect(() => {
    if (isOpen && location) {
      setMapCenter([location.lat, location.lng]);
      setCurrentAddress(location.displayName);
      setInitialAddress(location.displayName);
    } else if (isOpen && !location) {
      setMapCenter([13.0827, 80.2707]);
      setCurrentAddress("Move the map to select location");
      setInitialAddress(null);
    }
  }, [isOpen, location]);

  useEffect(() => {
    const searchLocation = async () => {
      if (!debouncedSearchTerm.trim()) return;
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${debouncedSearchTerm}`
        );
        const data = await response.json();
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          mapRef.current?.flyTo([parseFloat(lat), parseFloat(lon)], 16);
        }
      } catch (error) {
        console.error("Search failed", error);
      }
    };
    searchLocation();
  }, [debouncedSearchTerm]);

  const handlePositionChange = async (pos: LatLng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}`
      );
      const data = await response.json();
      if (data && data.display_name) {
        setCurrentAddress(data.display_name);
        setAddressDetails({
          city:
            data.address.city ||
            data.address.town ||
            data.address.village ||
            "",
          state: data.address.state || "",
        });
      } else {
        setCurrentAddress("Could not find address.");
      }
    } catch (error) {
      console.error("Reverse geocoding failed", error);
      setCurrentAddress("Failed to fetch address.");
    }
  };

  const handleDetectLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMapCenter([latitude, longitude]);
        mapRef.current?.flyTo([latitude, longitude], 16);
      },
      () => showAlert("Could not detect your location.", "error")
    );
  };

  const handleConfirmLocation = async () => {
    const center = mapRef.current!.getCenter();
    const newLocationData = {
      lat: center.lat,
      lng: center.lng,
      displayName: currentAddress,
    };

    setLocation(newLocationData);

    if (isAuthenticated) {
      try {
        await api.put("/api/customer/users/location", {
          address: currentAddress,
          city: addressDetails.city,
          state: addressDetails.state,
          lat: newLocationData.lat,
          lng: newLocationData.lng,
        });
        showAlert("Location updated!", "success");
        onClose();
      } catch (error) {
        console.error("Failed to update location", error);
        showAlert("Could not save your new location.", "error");
        onClose();
      }
    } else {
      setShowLoginTooltip(true);
      setTimeout(() => setShowLoginTooltip(false), 3000);
      setTimeout(() => onClose(), 500);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute top-full mt-2 left-0 z-50 bg-white rounded-lg shadow-2xl w-96 max-w-sm overflow-hidden border border-gray-200"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="p-3 border-b border-gray-200 relative">
            <h3 className="font-semibold text-center">Change Location</h3>
            <button
              onClick={onClose}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              <HiX size={20} />
            </button>
          </div>

          <div className="p-3 space-y-3">
            <button
              onClick={handleDetectLocation}
              className="w-full bg-green-100 text-green-700 font-bold px-4 py-2 rounded-md text-sm flex items-center justify-center gap-2"
            >
              <HiOutlineLocationMarker />
              Detect my location
            </button>
            <div className="relative">
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search delivery location"
                className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="relative h-64">
            <MapContainer
              key={`${mapCenter[0]}-${mapCenter[1]}`}
              ref={mapRef}
              center={mapCenter}
              zoom={15}
              scrollWheelZoom={true}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapEvents onPositionChange={handlePositionChange} />
            </MapContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[1000] pointer-events-none">
              <HiLocationMarker size={32} className="text-red-500" />
            </div>
          </div>

          <div className="p-3 bg-gray-50 flex items-center gap-4 border-t border-gray-200">
            <div className="flex-grow text-xs min-w-0">
              <p className="font-bold text-gray-500">SELECTED</p>
              <p className="truncate font-semibold">{currentAddress}</p>
            </div>
            <button
              disabled={isConfirmDisabled}
              onClick={handleConfirmLocation}
              className="bg-green-600 text-white font-bold px-4 py-2 rounded-lg text-sm whitespace-nowrap disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Confirm
            </button>
            {showLoginTooltip && (
              <Tooltip message="Login to save this location" loginLink={true} />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LocationPicker;
