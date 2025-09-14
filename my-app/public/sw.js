// public/sw.js
const APP_VERSION = "2025-09-12-01";

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data) return;
  if (data.type === "LOG_JSON") {
    console.log("[SW] 受け取ったJSON:", data.payload);
  }
});

self.addEventListener("install", () => {
  console.log("[SW] install", APP_VERSION);
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  console.log("[SW] activate", APP_VERSION);
  event.waitUntil(self.clients.claim());
});
