const safePath = value => typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/notifications';

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', event => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch { payload = { body: event.data?.text() || '' }; }
  const options = {
    body: payload.body || 'There is a new update in QuickFix.',
    icon: '/quickfix-mark.svg',
    badge: '/quickfix-mark.svg',
    tag: payload.tag || 'quickfix-update',
    data: { path: safePath(payload.path) },
    vibrate: [120, 60, 120]
  };
  event.waitUntil(self.registration.showNotification(payload.title || 'QuickFix', options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL(safePath(event.notification.data?.path), self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const current = windows.find(client => new URL(client.url).origin === self.location.origin);
    if (current) {
      await current.navigate(target);
      return current.focus();
    }
    return self.clients.openWindow(target);
  })());
});
