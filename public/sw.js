// Minimal service worker — exists solely to satisfy Chromium's PWA install
// criteria (the "Install app" option requires a registered SW with a fetch
// handler scoped to start_url). We do not cache or intercept anything.

self.addEventListener("install", () => {
  // Activate immediately instead of waiting for old tabs to close.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Take control of any open clients right away.
  event.waitUntil(self.clients.claim());
});

// Pass-through fetch handler. Chromium requires *some* fetch listener to be
// registered for installability — returning here lets the browser handle the
// request normally, no rewrite or interception.
self.addEventListener("fetch", () => {
  return;
});
