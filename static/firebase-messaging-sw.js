// Push service worker (no Firebase SDK). The server sends data-only FCM messages
// ({ data: { title, body, link } }) and we ALWAYS show a notification: iOS can revoke
// the subscription for pushes that show nothing.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

function readPayload(event) {
  let p = {};
  try { p = event.data ? event.data.json() : {}; } catch { p = {}; }
  const d = (p && p.data) || {};
  const n = (p && p.notification) || {};
  return {
    title: d.title || p.title || n.title || 'Casa',
    body: d.body || p.body || n.body || '',
    link: d.link || p.link || (p.fcmOptions && p.fcmOptions.link) || '/',
  };
}

self.addEventListener('push', (event) => {
  const { title, body, link } = readPayload(event);
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { link },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = new URL((event.notification.data && event.notification.data.link) || '/', self.location.origin).href;
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const client = all.find(c => new URL(c.url).origin === self.location.origin);
    if (client) {
      try { await client.focus(); } catch { /* focus not allowed: still switch the tab */ }
      client.postMessage({ type: 'open-tab', link });
      return;
    }
    await self.clients.openWindow(link);
  })());
});
