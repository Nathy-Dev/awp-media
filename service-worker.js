// self.addEventListener("install", (event) => {
//   event.waitUntil(
//     caches.open("app-cache").then((cache) => {
//       return cache.addAll(["/", '/index.html', '/styles.css', '/script.js', '/icons/awp-logo-192x192.png', '/icons/awp-logo-512x512.png']);
//     })
//   );
// });

// self.addEventListener("fetch", (event) => {
//   event.respondWith(
//     caches.match(event.request).then((response) => {
//       return response || fetch(event.request);
//     })
//   );
// });
