/* eslint-disable no-restricted-globals */

// A name for your cache
const CACHE_NAME = "react-app-cache-v1";

// Files to cache (adjust as needed)
const URLS_TO_CACHE = ["/", "/index.html"];

// Install event — pre-cache assets
self.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  );
});

// Fetch event — serve cached files if available
self.addEventListener("fetch", (event: FetchEvent) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

// Activate event — clean up old caches
self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cache) =>
          cache !== CACHE_NAME ? caches.delete(cache) : null
        )
      )
    )
  );
});

export {};
