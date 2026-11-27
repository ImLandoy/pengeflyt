// Pengeflyt service worker: gjer at appen kan installerast og opnast raskt.
// Alltid nettverket først, så du får nyaste versjon når du er på nett. Mellomlageret blir berre
// brukt når du er utan nett. Dataa dine ligg i Firebase og blir ikkje lagra her.
const CACHE = "pengeflyt-v11";
const CORE = ["./", "./index.html", "./style.css?v=11", "./icons.js?v=11", "./app.js?v=11", "./firebase-store.js?v=11", "./manifest.webmanifest", "./icon-192.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const own = url.origin === location.origin;
  const firebaseLib = url.hostname === "www.gstatic.com" && url.pathname.startsWith("/firebasejs/");
  if (!own && !firebaseLib) return; // innlogging og database går rett til Firebase
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || (req.mode === "navigate" ? caches.match("./index.html") : undefined)))
  );
});
