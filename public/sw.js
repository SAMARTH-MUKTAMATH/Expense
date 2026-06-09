// Service worker — handles PWA install criteria + Web Push delivery.
//
// Push payload format (sent by lib/push.js):
//   { title: string, body: string, url?: string, tag?: string }

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Pass-through fetch handler — required by Chromium for PWA installability,
// but we don't intercept / cache anything.
self.addEventListener("fetch", () => {
  return;
});

// Show a notification when the server pushes one.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "BudgetFLOW", body: event.data?.text() || "" };
  }

  const title = data.title || "BudgetFLOW";
  const options = {
    body: data.body || "",
    icon: "/icon",
    badge: "/icon",
    tag: data.tag || "budgetflow",
    data: { url: data.url || "/dashboard" },
    // Lower-priority dismissable banner; user can swipe away.
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Focus an existing tab or open a new one when the user taps the notification.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.endsWith(targetUrl) && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
