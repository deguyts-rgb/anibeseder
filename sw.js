// אני בסדר - Service Worker with FCM Push Support
const CACHE_NAME = ‘ani-beseder-v4’;
const ASSETS = [’/’, ‘/index.html’, ‘/manifest.json’];

// Install
self.addEventListener(‘install’, e => {
e.waitUntil(
caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
);
});

// Activate
self.addEventListener(‘activate’, e => {
e.waitUntil(
caches.keys().then(keys =>
Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
).then(() => self.clients.claim())
);
});

// Fetch - network first, cache fallback
self.addEventListener(‘fetch’, e => {
if (e.request.method !== ‘GET’) return;
e.respondWith(
fetch(e.request).catch(() => caches.match(e.request))
);
});

// Push notifications from FCM
self.addEventListener(‘push’, e => {
if (!e.data) return;
let data;
try { data = e.data.json(); } catch { data = { notification: { title: ‘אני בסדר’, body: e.data.text() } }; }

const { title, body, icon = ‘/icon-192.png’ } = data.notification || {};
e.waitUntil(
self.registration.showNotification(title || ‘אני בסדר’, {
body: body || ‘’,
icon,
badge: ‘/icon-192.png’,
dir: ‘rtl’,
lang: ‘he’,
requireInteraction: true,
data: { url: ‘https://anibeseder.netlify.app’ }
})
);
});

// Notification click - open app
self.addEventListener(‘notificationclick’, e => {
e.notification.close();
const url = e.notification.data?.url || ‘https://anibeseder.netlify.app’;
e.waitUntil(
clients.matchAll({ type: ‘window’, includeUncontrolled: true }).then(list => {
for (const c of list) {
if (c.url.includes(‘anibeseder’) && ‘focus’ in c) return c.focus();
}
return clients.openWindow(url);
})
);
});
