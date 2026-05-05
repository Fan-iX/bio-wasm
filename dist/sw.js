// A service worker for caching assets
const CACHE_NAME = 'bio-wasm-assets'
const ASSETS_URL_PREFIX = "https://cdn.jsdelivr.net/npm/bio-wasm@latest/wasm/"
const METADATA_URL = "https://data.jsdelivr.com/v1/package/resolve/npm/bio-wasm@latest"

self.addEventListener('install', event => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))

async function checkUpdate() {
    let cache = await caches.open(CACHE_NAME)
    const { version: cachedVersion } = await cache.match(METADATA_URL)?.then?.(r => r?.json?.()) ?? {}
    const response = await fetch(METADATA_URL)
    const { version } = await response.clone().json()
    if (version === cachedVersion) return
    await caches.delete(CACHE_NAME)
    cache = await caches.open(CACHE_NAME)
    await cache.put(METADATA_URL, response)
}

self.addEventListener('message', (event) => {
    if (event.data === 'CHECK_UPDATE') checkUpdate()
})

self.addEventListener('fetch', (event) => {
    if (!event.request.url.startsWith(ASSETS_URL_PREFIX)) return
    event.respondWith(caches.match(event.request).then(async response => {
        if (response) return response
        let cache = await caches.open(CACHE_NAME)
        let resp = await fetch(event.request)
        if (resp.ok) cache.put(event.request, resp.clone())
        return resp
    }))
})
