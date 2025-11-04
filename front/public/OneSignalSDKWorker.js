importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

self.addEventListener("notificationdisplay", (event) => {
  // console.log("🟢 Notificación mostrada:", event.notification);
  const data = event.notification.data || {};

  // opcional: enviar evento al backend
  fetch("https://www.checancha.com/api/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: event.notification.title,
      body: event.notification.body,
      data,
      timestamp: new Date().toISOString(),
    }),
  });
});

self.addEventListener("notificationclick", (event) => {
  // console.log("🟠 Notificación clickeada:", event.notification);
  event.notification.close();

  const targetUrl =
    event.notification.data?.url || "https://www.checancha.com/";
  event.waitUntil(clients.openWindow(targetUrl));
});