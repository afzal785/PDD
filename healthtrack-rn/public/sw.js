self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || '⏰ Medicine Reminder Alarm';
  const options = {
    body: data.body || 'It is time to take your scheduled medication dose.',
    icon: 'https://cdn-icons-png.flaticon.com/512/883/883407.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/883/883407.png',
    vibrate: [300, 100, 300, 100, 300],
    requireInteraction: true,
    tag: 'medication-alarm',
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
