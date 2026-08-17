const CACHE_NAME = "dad-tetris-v48";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
];

function isAppShell(url) {
  const path = url.pathname.toLowerCase();
  return (
    path.endsWith("/") ||
    path.endsWith(".html") ||
    path.endsWith(".css") ||
    path.endsWith(".js")
  );
}

function isMedia(req, url) {
  const dest = req.destination;
  if (dest === "image" || dest === "audio" || dest === "video" || dest === "font") {
    return true;
  }
  const path = url.pathname.toLowerCase();
  return /\.(png|jpe?g|gif|webp|svg|mp3|wav|ogg|m4a|mp4|webm)$/.test(path);
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(CORE_ASSETS.map((url) => cache.add(url).catch(() => null)));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") {
    return;
  }
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) {
    return;
  }
  event.respondWith((async () => {
    if (isMedia(req, url)) {
      try {
        const fresh = await fetch(req);
        return fresh;
      } catch (err) {
        return new Response("", { status: 404, statusText: "Not Found" });
      }
    }
    const cache = await caches.open(CACHE_NAME);
    if (isAppShell(url)) {
      try {
        const fresh = await fetch(req, { cache: "no-store" });
        if (fresh && fresh.ok) {
          cache.put(req, fresh.clone());
        }
        return fresh;
      } catch (err) {
        return (await cache.match(req)) || (await cache.match("./index.html")) || Response.error();
      }
    }
    const cached = await cache.match(req);
    if (cached) {
      return cached;
    }
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.ok) {
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (err) {
      return new Response("", { status: 404, statusText: "Not Found" });
    }
  })());
});
