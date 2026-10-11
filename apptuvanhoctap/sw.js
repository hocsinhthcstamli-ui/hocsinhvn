const CACHE = "cung-con-public-v10";
const PUBLIC_FILES = [
  "/offline.html",
  "/styles.css",
  "/mobile.css",
  "/app.js",
  "/domain.mjs",
  "/speech.mjs",
  "/pathways.mjs",
  "/pathway-ui.mjs",
  "/art.mjs",
  "/curriculum.mjs",
  "/curriculum-ui.mjs",
  "/youtube.mjs",
  "/drive.mjs",
  "/artwork.css",
  ...[
    "stage-1",
    "stage-2",
    "stage-3",
    "buddy-welcome",
    "buddy-growing",
    "buddy-success",
    "badge-start",
    "badge-connect",
    "badge-independent",
    "garden",
    "journey-background",
    "lesson-cover",
  ].map((name) => `/assets/art/${name}.webp`),
  "/pwa.js",
  "/manifest.webmanifest",
  "/assets/icons/app-192.png",
  "/assets/icons/app-512.png",
  "/assets/icons/app-maskable.png",
  "/assets/icons/apple-touch-icon.png",
];
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PUBLIC_FILES)),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key.startsWith("cung-con-public-") && key !== CACHE)
          await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "ACTIVATE_UPDATE") self.skipWaiting();
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  // Never cache API responses, session data, uploaded pictures or source documents.
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/materials/")
  )
    return;
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline.html")),
    );
    return;
  }
  if (!PUBLIC_FILES.includes(url.pathname)) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch {
        return (
          (await cache.match(request)) || new Response("", { status: 503 })
        );
      }
    })(),
  );
});
