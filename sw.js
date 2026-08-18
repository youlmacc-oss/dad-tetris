const APP_VERSION = "1.1.1-stable";
const CACHE_NAME = "dad-tetris-v" + APP_VERSION;
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./404.html",
  "./style.css?v=" + APP_VERSION,
  "./script.js?v=" + APP_VERSION,
  "./manifest.json",
  "./assets/images/default_bg.jpg",
  "./assets/bg-default.png",
  "./assets/images/level_1.jpg",
  "./assets/images/level_2.jpg",
  "./assets/images/level_3.jpg",
  "./assets/images/level_4.jpg",
  "./assets/images/level_5.jpg",
  "./assets/images/level_6.jpg",
  "./assets/images/level_7.jpg",
  "./assets/images/level_8.jpg",
  "./assets/images/level_9.jpg",
  "./assets/images/level_10.jpg",
  "./assets/audio/bgm_default.mp3",
  "./icons/icon.svg",
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

self.addEventListener("message", (event) => {
  const data = event && event.data;
  if (data && (data.type === "SKIP_WAITING" || data === "SKIP_WAITING")) {
    self.skipWaiting();
  }
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
        if (fresh && fresh.ok) {
          try {
            const cache = await caches.open(CACHE_NAME);
            cache.put(req, fresh.clone());
          } catch (cacheErr) {
            /* cache optional */
          }
          return fresh;
        }
      } catch (err) {
        /* fall through to cache */
      }
      const cachedMedia = await caches.match(req);
      if (cachedMedia) {
        return cachedMedia;
      }
      return new Response("", { status: 404, statusText: "Not Found" });
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
        return (await cache.match(req))
          || (await cache.match("./index.html"))
          || (await cache.match("./"))
          || Response.error();
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
