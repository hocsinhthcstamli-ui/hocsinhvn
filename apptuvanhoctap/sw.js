const CACHE = "cung-con-public-v15";
const PUBLIC_FILES = [
  "/offline.html",
  "/styles.css",
  "/mobile.css",
  "/app.js",
  "/domain.mjs",
  "/speech.mjs",
  "/voice-manifest.mjs",
  "/card-art.mjs",
  "/card-art-manifest.mjs",
  "/pathways.mjs",
  "/pathway-ui.mjs",
  "/art.mjs",
  "/new-art.mjs",
  "/journey-ui.mjs",
  "/content/topic-journeys.mjs",
  "/content/topic-videos.mjs",
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
    "buddy-request",
    "journey-life",
    "journey-animals",
    "journey-vehicles",
    "animals-discover",
    "animals-communicate",
    "animals-practice",
    "vehicles-communicate",
    "vehicles-practice",
    "animal-cat",
    "animal-rabbit",
    "animal-hen",
    "animal-duck",
    "animal-goat",
    "animal-sheep",
    "animal-frog",
    "animal-elephant",
    "vehicle-car",
    "vehicle-motorbike",
    "vehicle-bus",
    "vehicle-ambulance",
    "vehicle-helicopter",
    "vehicle-boat",
    "vehicle-metro",
    "sticker-explore",
    "sticker-care",
    "sticker-choose",
    "sticker-together",
    "sticker-step",
    "sticker-wave",
    "communication-help",
    "communication-together",
    "vehicle-seatbelt",
    "vehicle-helmet",
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
  // Only public, content-addressed teaching assets; never learner uploads.
  const lessonAsset = /^\/assets\/(?:voice\/[a-f0-9]{20}\.mp3|cards\/[a-f0-9]{16}\.webp)$/.test(url.pathname);
  if (!PUBLIC_FILES.includes(url.pathname) && !lessonAsset) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      if (lessonAsset) {
        const cached = await cache.match(request);
        if (cached) return cached;
      }
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
