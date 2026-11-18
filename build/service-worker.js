// The Vite build fills these from the final output of both app entries.
const cachePrefix = "earcade-shell-";
const currentCache = cachePrefix + "__REVISION__";
const assets = new Set(__PRECACHE_PATHS__);
const pages = new Map([
  ["/", "/index.html"],
  ["/synth-lab", "/synth-lab/index.html"],
  ["/synth-lab/", "/synth-lab/index.html"],
]);

self.addEventListener("install", event => {
  event.waitUntil(caches.open(currentCache).then(cache =>
    cache.addAll(Array.from(assets, path => new Request(path, { cache: "reload" })))
  ));
  // A new release waits until all tabs using the previous release have closed.
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(cachePrefix) && key !== currentCache)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  const navigation = request.mode === "navigate";
  const path = navigation ? pages.get(url.pathname) ?? url.pathname : url.pathname;
  if (!assets.has(path)) return;

  event.respondWith((async () => {
    const cache = await caches.open(currentCache);
    const hit = await cache.match(path);
    if (!hit) return fetch(request);
    // Some static hosts redirect index.html to the directory URL.
    if (navigation && hit.redirected) {
      return new Response(hit.body, { headers: hit.headers, status: hit.status, statusText: hit.statusText });
    }
    return hit;
  })());
});
