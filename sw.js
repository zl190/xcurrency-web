// xConvert service worker — offline-first shell, network-first for rates API.
const CACHE = "xconv-v2";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./Sortable.min.js"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Rates API: never cache (always want freshest); app falls back to localStorage if offline.
  if (url.hostname.startsWith("api.frankfurter.")) return;
  // App shell: cache-first.
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request))
  );
});
