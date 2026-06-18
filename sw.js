const CACHE_NAME = "ludo-cache-v2";
const STATIC_FILES = [
  "./css/style.css",
  "./js/constants.js",
  "./js/audio.js",
  "./js/storage.js",
  "./js/ui.js",
  "./js/events.js",
  "./js/board.js",
  "./js/movement.js",
  "./js/dice.js",
  "./js/db.js",
  "./js/home.js",
  "./js/game.js",
  "./manifest.json",
];
const ALL_FILES = ["./", "./index.html", ...STATIC_FILES];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ALL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // HTML 文件：network-first（优先网络，确保更新及时）
  if (url.pathname === "/" || url.pathname.endsWith("/index.html")) {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          return response;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // 静态资源：cache-first（优先缓存，离线可用）
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
