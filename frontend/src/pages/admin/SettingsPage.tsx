import React, { useState, useEffect } from "react";
import { useSettings } from "../../context/admin/settings/useSettings";
import {
  registerForPushNotifications,
  unsubscribeFromPushNotifications,
} from "../../utils/pushManager";

const ToggleSwitch: React.FC<{
  enabled: boolean;
  onChange: () => void;
  disabled?: boolean;
}> = ({ enabled, onChange, disabled }) => (
  <button
    onClick={onChange}
    disabled={disabled}
    className={`relative inline-flex items-center h-7 rounded-full w-12 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50
        ${enabled ? "bg-blue-600" : "bg-gray-300"}`}
  >
    <span
      className={`inline-block w-5 h-5 transform bg-white rounded-full transition-transform duration-300 ${
        enabled ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

const SettingsPage: React.FC = () => {
  const { settings, setSettings } = useSettings();
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setIsPushEnabled(!!subscription);
        } catch (error) {
          console.error("Error checking push subscription:", error);
        }
      }
      setIsPushLoading(false);
    };
    checkSubscription();
  }, []);

  const handleSoundToggle = () => {
    setSettings({ isSoundEnabled: !settings.isSoundEnabled });
  };

  const handlePushToggle = async () => {
    setIsPushLoading(true);
    if (isPushEnabled) {
      const success = await unsubscribeFromPushNotifications("admin");
      if (success) {
        console.log("Push notifications disabled.");
        setIsPushEnabled(false);
      } else {
        console.error("Failed to disable push notifications.");
      }
    } else {
      const success = await registerForPushNotifications("admin");
      if (success) {
        console.log("Push notifications enabled.");
        setIsPushEnabled(true);
      } else {
        console.error("Failed to enable push notifications.");
      }
    }
    setIsPushLoading(false);
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-full">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Settings</h1>
        <div className="bg-white rounded-xl shadow-md divide-y divide-gray-200">
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="font-semibold text-lg text-gray-800">
                New Order Sound
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Play an audible alert when a new order arrives on the Sales
                Orders page.
              </p>
            </div>
            <ToggleSwitch
              enabled={settings.isSoundEnabled}
              onChange={handleSoundToggle}
            />
          </div>

          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="font-semibold text-lg text-gray-800">
                Web Push Notifications
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Receive alerts for new orders even when the browser is in the
                background.
              </p>
            </div>
            <ToggleSwitch
              enabled={isPushEnabled}
              onChange={handlePushToggle}
              disabled={isPushLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
