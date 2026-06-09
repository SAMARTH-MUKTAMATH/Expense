// Minimal service worker — exists primarily so Chromium's PWA install
// criteria are satisfied (the install button only completes when there is a
// registered SW with a fetch handler scoped to the start_url).
//
// We deliberately do NOT cache responses here. The app is server-rendered
// and data-driven; serving stale dashboards / transactions would be more
// harmful than helpful. If real offline support is added later, this is
// the file to extend (or replace with @serwist/next).

self.addEventListener("install", () => {
  // Activate immediately instead of waiting for old tabs to close.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Take control of any open clients right away.
  event.waitUntil(self.clients.claim());
});

// Pass-through fetch handler. Chromium requires *some* fetch listener to be
// registered for installability — `return` here means the browser handles
// the request normally, no rewrite or interception.
self.addEventListener("fetch", () => {
  return;
});
