// exists only to satisfy Chromium's PWA install criteria
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Chromium requires a fetch listener for installability
self.addEventListener("fetch", () => {
  return;
});
