// A browser's Web Push subscription (from PushManager.subscribe), owned by a user.
// One user can have several: a phone and a laptop each subscribe separately.
export type PushSubscription = {
  userId: string
  endpoint: string // the push service URL; unique per browser install
  keys: { p256dh: string; auth: string }
  createdAt: Date
}

// What a notification shows. The service worker renders it and opens `url` on tap.
export type Notification = {
  title: string
  body: string
  url: string // an app path, e.g. '/today'
  tag: string // same tag replaces an unread notification instead of stacking
}
