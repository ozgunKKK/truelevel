const CACHE_NAME = "truelevel-cache-v12";
const APP_SHELL = [
  "./",
  "./index.html",
  "./calibrate.html",
  "./measure.html",
  "./results.html",
  "./recalibrate.html",
  "./calibrations.html",
  "./settings.html",
  "./css/style.css",
  "./js/matrix.js",
  "./js/leveling.js",
  "./js/theme.js",
  "./js/prefs.js",
  "./js/backup.js",
  "./js/settings.js",
  "./js/storage.js",
  "./js/home.js",
  "./js/calibrate.js",
  "./js/measure.js",
  "./js/results.js",
  "./js/recalibrate.js",
  "./js/calibrations.js",
  "./js/register-sw.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    // "no-cache" forces revalidation so a stale HTTP-cached copy (GitHub Pages
    // sends max-age=600) never gets frozen into the new cache.
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.addAll(APP_SHELL.map((url) => new Request(url, { cache: "no-cache" })))
      )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request, { cache: "no-cache" })
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
