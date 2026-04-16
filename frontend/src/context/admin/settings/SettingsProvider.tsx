import { useState, useEffect, type ReactNode } from "react";
import { SettingsContext, type AdminSettings } from "./SettingsContext.ts";

const SETTINGS_STORAGE_KEY = "farmerLogisticsAdminSettings";

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AdminSettings>(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      return savedSettings
        ? JSON.parse(savedSettings)
        : { isSoundEnabled: true };
    } catch (error) {
      console.error("Failed to load settings from localStorage:", error);
      return { isSoundEnabled: true };
    }
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<AdminSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, setSettings: updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
