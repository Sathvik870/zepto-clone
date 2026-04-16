import { createContext } from 'react';

export interface AdminSettings {
  isSoundEnabled: boolean;
}

export interface SettingsContextType {
  settings: AdminSettings;
  setSettings: (settings: Partial<AdminSettings>) => void;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);