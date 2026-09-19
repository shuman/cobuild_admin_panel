/**
 * CoBuild SuperAdmin — manual service worker (no dependencies).
 *
 * Strategy:
 *  - NEVER intercept non-GET, cross-origin (backend API via NEXT_PUBLIC_API_URL,
 *    raw /health/json fetches), or /api/* (NextAuth) requests — authenticated
 *    responses must never be served from cache.
 *  - Cache-first for immutable static assets (_next/static is content-hashed,
 *    images, icons, fonts, manifest).
 *  - Network-first for same-origin HTML navigations; on failure serve the cached
 *    copy of the page, else the /offline fallback.
 *
 * Deploy convention: bump VERSION when public assets or HTML change.
 * _next/static URLs are content-hashed, so they can never go stale.
 */

const VERSION = "cobuild-admin-v1";
const CACHE = `${VERSION}-precache`;
const PRECACHE_URLS = [
  "/offline",
  "/site.webmanifest",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
  "/apple-touch-icon.png",
  "/favicon-32x32.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Pass through untouched (no respondWith -> browser default) for anything
  // that must never be cached: mutations, cross-origin backend calls, /api/*.
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Cache-first: static assets.
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/images/") ||
    /\.(png|ico|svg|webp|woff2?|manifest)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(
              caches.open(CACHE).then((cache) => cache.put(request, copy))
            );
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first: HTML navigations. Redirected responses (auth middleware
  // bounces to /login) are never cached, only direct 200s.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && !response.redirected) {
            const copy = response.clone();
            event.waitUntil(
              caches.open(CACHE).then((cache) => cache.put(request, copy))
            );
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/offline"))
        )
    );
  }
});
