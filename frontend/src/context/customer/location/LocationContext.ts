import { createContext } from "react";

export interface LocationData {
  lat: number;
  lng: number;
  displayName: string;
}

export interface LocationContextType {
  location: LocationData | null;
  setLocation: (location: LocationData | null) => void;
}

export const LocationContext = createContext<LocationContextType | undefined>(undefined);