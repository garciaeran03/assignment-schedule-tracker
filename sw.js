const CACHE_NAME = "eran-study-hub-v2";

const APP_FILES = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./supabase-config.js",
    "./manifest.json",
    "./icon-192.png",
    "./icon-512.png"
];


// INSTALL
self.addEventListener("install", event => {

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(APP_FILES);
            })
    );

    self.skipWaiting();
});


// ACTIVATE
self.addEventListener("activate", event => {

    event.waitUntil(
        caches.keys()
            .then(cacheNames => {

                return Promise.all(
                    cacheNames
                        .filter(cacheName => cacheName !== CACHE_NAME)
                        .map(cacheName => caches.delete(cacheName))
                );

            })
    );

    self.clients.claim();
});


// FETCH
self.addEventListener("fetch", event => {

    const request = event.request;

    // Do not cache Supabase/API requests
    if (
        request.url.includes("supabase.co") ||
        request.method !== "GET"
    ) {
        return;
    }

    event.respondWith(

        fetch(request)
            .then(response => {

                const responseClone = response.clone();

                caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(request, responseClone);
                    });

                return response;

            })
            .catch(() => {

                return caches.match(request);

            })

    );
});
