// Ani Beseder Service Worker v4
var CACHE_NAME = ‘ani-beseder-v5’;
var ASSETS = [’/’, ‘/index.html’, ‘/manifest.json’];

self.addEventListener(‘install’, function(e) {
e.waitUntil(
caches.open(CACHE_NAME).then(function(cache) {
return cache.addAll(ASSETS);
}).then(function() {
return self.skipWaiting();
})
);
});

self.addEventListener(‘activate’, function(e) {
e.waitUntil(
caches.keys().then(function(keys) {
return Promise.all(
keys.filter(function(k) { return k !== CACHE_NAME; })
.map(function(k) { return caches.delete(k); })
);
}).then(function() {
return self.clients.claim();
})
);
});

self.addEventListener(‘fetch’, function(e) {
if (e.request.method !== ‘GET’) return;
e.respondWith(
fetch(e.request).catch(function() {
return caches.match(e.request);
})
);
});

self.addEventListener(‘push’, function(e) {
if (!e.data) return;
var data;
try { data = e.data.json(); } catch(err) { data = { notification: { title: ‘Ani Beseder’, body: e.data.text() } }; }
var notif = data.notification || {};
var title = notif.title || ‘Ani Beseder’;
var body = notif.body || ‘’;
e.waitUntil(
self.registration.showNotification(title, {
body: body,
icon: ‘/icon-192.png’,
badge: ‘/icon-192.png’,
dir: ‘rtl’,
lang: ‘he’,
requireInteraction: true,
data: { url: ‘https://anibeseder.netlify.app’ }
})
);
});

self.addEventListener(‘notificationclick’, function(e) {
e.notification.close();
var url = (e.notification.data && e.notification.data.url) || ‘https://anibeseder.netlify.app’;
e.waitUntil(
clients.matchAll({ type: ‘window’, includeUncontrolled: true }).then(function(list) {
for (var i = 0; i < list.length; i++) {
if (list[i].url.includes(‘anibeseder’) && ‘focus’ in list[i]) return list[i].focus();
}
return clients.openWindow(url);
})
);
});
