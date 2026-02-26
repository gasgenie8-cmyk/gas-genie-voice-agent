const CACHE_NAME = 'gas-genie-v2';
const OFFLINE_URL = '/reference';

// Files to pre-cache for offline access
const PRECACHE_URLS = [
    '/',
    '/reference',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png',
    '/favicon.svg',
];

// Install: pre-cache key pages
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_URLS);
        })
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch: network-first with cache fallback
self.addEventListener('fetch', (event) => {
    // Only handle same-origin GET requests
    if (event.request.method !== 'GET') return;
    if (!event.request.url.startsWith(self.location.origin)) return;

    // Skip API calls (always need fresh data)
    if (event.request.url.includes('supabase.co')) return;
    if (event.request.url.includes('firebaseio.com')) return;
    if (event.request.url.includes('googleapis.com')) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Cache successful responses
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => {
                // Serve from cache when offline
                return caches.match(event.request).then((cached) => {
                    if (cached) return cached;
                    // For navigation requests, show the reference page (works offline)
                    if (event.request.mode === 'navigate') {
                        return caches.match(OFFLINE_URL) || caches.match('/');
                    }
                    return new Response('Offline', { status: 503, statusText: 'Offline' });
                });
            })
    );
});
