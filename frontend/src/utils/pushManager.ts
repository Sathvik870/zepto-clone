import api from "../api";

const PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const registerForPushNotifications = async (
  userType: "admin" | "customer"
) => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.error("Push not supported");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
      });
    }
    const subscribeUrl =
      userType === "admin"
        ? "/api/admin/push/subscribe"
        : "/api/customer/push/subscribe";

    await api.post(subscribeUrl, subscription);
    return true;
  } catch (error) {
    console.error("Push Registration Failed:", error);
    return false;
  }
};

export const unsubscribeFromPushNotifications = async (
  userType: "admin" | "customer"
) => {
  if (!("serviceWorker" in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const unsubscribeUrl =
        userType === "admin"
          ? "/api/admin/push/unsubscribe"
          : "/api/customer/push/unsubscribe";
      await api.post(unsubscribeUrl, subscription);
      await subscription.unsubscribe();
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Push Unsubscription Failed for ${userType}:`, error);
    return false;
  }
};
