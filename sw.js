/* Ruta Asia 2027: guarda la guía en el teléfono para usarla sin señal ni VPN.
   La arma build_guia.py; la versión cambia sola cuando cambia cualquier archivo. */
const V = "ruta-asia-c71d35d11d";
const FONTS = "ruta-asia-fuentes";
const PRE = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png", "favicon.png", "guia/", "guia/index.html", "guia/manifest.webmanifest", "guia/icon-192.png", "guia/icon-512.png", "guia/apple-touch-icon.png", "guia/fotos/ca-vancouver.jpg", "guia/fotos/cn-gran-muralla.jpg", "guia/fotos/cn-yuyuan-noche.jpg", "guia/fotos/f-cn-ciudad-prohibida.jpg", "guia/fotos/f-jp-yasaka.jpg", "guia/fotos/f-kr-palacio.jpg", "guia/fotos/hk-bahia-victoria.jpg", "guia/fotos/jp-fuji-pagoda.jpg", "guia/fotos/kr-gyeongbokgung.jpg"];
const OK = "__guardado";

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(V);
    await c.addAll(PRE.map(u => new Request(u, {cache: "reload"})));
    await c.put(OK, new Response(V));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== V && k !== FONTS) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  /* tipografías de Google: guardar la primera vez que se ven */
  if (/^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(FONTS).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r && (r.ok || r.type === "opaque")) c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  if (/\.ics$/.test(url.pathname)) return; /* avisos: siempre desde internet */
  e.respondWith((async () => {
    const c = await caches.open(V);
    const nav = req.mode === "navigate";
    const hit = await c.match(req, {ignoreSearch: nav});
    if (hit && nav) return hit; /* la página nueva llega con la versión nueva del service worker */
    /* lo guardado responde al instante; con señal se revisa si hay algo nuevo */
    const net = fetch(req).then(r => { if (r && r.ok && !nav) c.put(req, r.clone()); return r; });
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    try { return await net; }
    catch (err) {
      if (nav) return (await c.match(url.pathname.indexOf("/guia/") >= 0 ? "guia/index.html" : "index.html")) || (await c.match("guia/index.html"));
      throw err;
    }
  })());
});
