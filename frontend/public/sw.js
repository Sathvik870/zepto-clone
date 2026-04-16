console.log("SW Loaded: /sw.js");

self.addEventListener("install", (evt) => {
  console.log("SW install");
  self.skipWaiting();
});

self.addEventListener("activate", (evt) => {
  console.log("SW activate");
  clients.claim();
});

self.addEventListener("push", function (event) {
  console.log("Push event received", event);
  let data = { title: "New Notification", body: "", url: "/" };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (err) {
    console.error("Failed to parse push event data", err);
  }

  const options = {
    body: data.body || "",
    icon: "/logo_png.png",
    badge: "/logo_png.png",
    data: {
      url: data.url || "/"
    },
    requireInteraction: !!data.requireInteraction
  };

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(data.title || "Notification", options);
      console.log("showNotification called with", data);
    })()
  );
});

self.addEventListener("notificationclick", function (event) {
  console.log("Notification click:", event.notification && event.notification.data);
  event.notification.close();

  const urlToOpen = event.notification?.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});