// 每次发布都递增版本，整套资源在安装完成后一起切换。
const CACHE_NAME = "ludo-cache-v4";
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
  "./js/backup.js",
  "./js/pwa.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./manifest.json",
];
const ALL_FILES = ["./index.html", ...STATIC_FILES];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ALL_FILES)).then(async () => {
      // v2 页面没有更新按钮，首次升级不能一直卡在 waiting。
      if (!self.registration.active || await caches.has('ludo-cache-v2')) return self.skipWaiting();
    })
  );
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith('ludo-cache-') && k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  const scope = new URL(self.registration.scope);

  // 首页和静态资源使用同一个已安装版本，避免新 HTML 配上旧 JS。
  if (e.request.mode === 'navigate' && (url.pathname === scope.pathname || url.pathname === scope.pathname + 'index.html')) {
    e.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(new URL('./index.html', scope).href).then((cached) => cached || fetch(e.request))
      )
    );
    return;
  }

  if (STATIC_FILES.some((path) => url.pathname === new URL(path, scope).pathname)) {
    e.respondWith(caches.open(CACHE_NAME).then((cache) =>
      cache.match(url.origin + url.pathname).then((cached) => cached || fetch(e.request))
    ));
  }
});
