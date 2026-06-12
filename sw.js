// xConvert service worker.
// Shell: stale-while-revalidate — serve from cache instantly (fast, offline),
// refresh the cache in the background so the next open auto-updates. No need
// to bump this file or hard-refresh on every deploy.
// Rates API + cross-origin: bypass the SW entirely (always hit network).
const CACHE = "xconv-v4";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./Sortable.min.js"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // Only same-origin GETs are cached; rates API and anything cross-origin go straight to network.
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  e.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(req).then((cached) => {
        const networked = fetch(req)
          .then((res) => {
            if (res && res.status === 200) cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached);   // offline: fall back to whatever we have
        return cached || networked; // cached now, refreshed for next time
      })
    )
  );
});
