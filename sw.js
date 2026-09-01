/**
 * STORY BY CLICKER BABU - LUXURY PWA SERVICE WORKER
 * Version: 1.0.0-production
 * Offline caching • Stale-while-revalidate • Cache-first static assets
 */

const CACHE_NAME = 'clickerbabu-v1';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/favicon.svg',
    '/robots.txt',
    '/sitemap.xml',
    '/assets/js/lenis.min.js',
    '/assets/images/clicker_babu_editorial_bw.webp',
    '/assets/images/clicker_babu_lead_artist.webp',
    '/assets/images/portfolio/hero_monochrome_symphony.webp',
    '/assets/images/portfolio/haldi_splash_explosion.webp',
    '/assets/images/portfolio/bridal_gilded_veil.webp'
];

// Install: Cache critical luxury assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// Activate: Purge old cache versions
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: Strategy Network-first for HTML, Cache-first for images & assets
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Skip non-GET requests or external analytics
    if (request.method !== 'GET' || url.origin !== self.location.origin) {
        return;
    }

    // Static Assets & Images: Cache First, fallback to network
    if (
        request.destination === 'image' ||
        request.destination === 'script' ||
        request.destination === 'style' ||
        request.destination === 'font'
    ) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
                    }
                    return networkResponse;
                });
            })
        );
        return;
    }

    // HTML Navigation: Network First, fallback to cached HTML
    event.respondWith(
        fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
            }
            return networkResponse;
        }).catch(() => {
            return caches.match(request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;
                return caches.match('/index.html');
            });
        })
    );
});
