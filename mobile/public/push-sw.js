// Loaded into the generated service worker (vite.config.ts → workbox.importScripts).
// The API sends { title, body, url, tag } (backend/src/domain/models/push.ts).

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Aurelius', {
      body: data.body,
      tag: data.tag,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: { url: data.url ?? '/today' },
    }),
  )
})

// Focus an open window and route it, or open the app at the notification's page.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL(event.notification.data?.url ?? '/today', self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => new URL(w.url).origin === self.location.origin)
      if (open) return open.navigate(url).then((w) => (w ?? open).focus())
      return self.clients.openWindow(url)
    }),
  )
})

// The browser rotated the subscription: tell the API about the new one.
self.addEventListener('pushsubscriptionchange', (event) => {
  const subscription = event.newSubscription
  if (!subscription) return
  event.waitUntil(
    fetch('/api/push/subscription', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(subscription.toJSON()),
    }),
  )
})
