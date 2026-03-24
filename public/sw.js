const CACHE_NAME = "qr-access-v3";
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icons.svg",
  "/apple-touch-icon.png",
  "/pwa-192.png",
  "/pwa-512.png",
];

function isCacheableRequest(request) {
  const url = new URL(request.url);

  if (request.method !== "GET") return false;
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith("/api/")) return false;

  return true;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) return cachedResponse;
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) return cachedResponse;

  const networkResponse = await fetch(request);
  if (networkResponse && networkResponse.status === 200) {
    cache.put(request, networkResponse.clone());
  }
  return networkResponse;
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (!isCacheableRequest(event.request)) return;

  const requestUrl = new URL(event.request.url);
  const isNavigationRequest =
    event.request.mode === "navigate" ||
    event.request.destination === "document" ||
    requestUrl.pathname === "/";

  event.respondWith(
    isNavigationRequest
      ? networkFirst(event.request)
      : cacheFirst(event.request),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
