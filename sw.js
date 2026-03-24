var CACHE_NAME = `ani-beseder-v162`;

self.addEventListener(`install`, function(e) {
e.waitUntil(self.skipWaiting());
});

self.addEventListener(`activate`, function(e) {
e.waitUntil(
caches.keys()
.then(function(keys) {
return Promise.all(
keys.filter(function(k) { return k !== CACHE_NAME; })
.map(function(k) { return caches.delete(k); })
);
})
.then(function() { return self.clients.claim(); })
.then(function() {
return self.clients.matchAll({ type: `window`, includeUncontrolled: true });
})
.then(function(clients) {
clients.forEach(function(c) { c.postMessage({ type: `SW_UPDATED` }); });
})
);
});

self.addEventListener(`fetch`, function(e) {});

self.addEventListener(`push`, function(e) {
if (!e.data) return;
var data;
try { data = e.data.json(); } catch(err) { data = { notification: { title: `ani beseder`, body: e.data.text() } }; }
var n = data.notification || {};
e.waitUntil(self.registration.showNotification(n.title || `ani beseder`, {
body: n.body || ``,
icon: `/icon-192.png`,
badge: `/icon-192.png`,
dir: `rtl`,
lang: `he`,
requireInteraction: true,
vibrate: [200, 100, 200],
data: { url: n.url || `https://anibeseder.com` }
}));
});

self.addEventListener(`notificationclick`, function(e) {
e.notification.close();
var targetUrl = (e.notification.data && e.notification.data.url) ? e.notification.data.url : `https://anibeseder.com`;
e.waitUntil(
clients.matchAll({ type: `window`, includeUncontrolled: true })
.then(function(list) {
for (var i = 0; i < list.length; i++) {
if (list[i].url.indexOf(`anibeseder`) > -1 && `focus` in list[i]) return list[i].focus();
}
return clients.openWindow(targetUrl);
})
);
});
