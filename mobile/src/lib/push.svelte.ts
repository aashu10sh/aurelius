// Web Push on this device: permission, the PushManager subscription, and
// keeping the API's copy of it in sync. Reminders themselves are sent by the
// API's cron + queue (backend/src/index.ts).
import { api } from './api/endpoints'
import { install } from './install.svelte'

const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

const ios = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

let subscribed = $state(false)
let permission = $state<NotificationPermission>(typeof Notification === 'undefined' ? 'denied' : Notification.permission)

// The service worker only exists in builds (it's off in dev), so don't wait on `ready` forever.
const registration = async () => {
  const reg = await navigator.serviceWorker.getRegistration()
  if (!reg) throw new Error('Notifications need the built app (the service worker is off in dev)')
  return reg
}

const toBytes = (base64url: string) =>
  Uint8Array.from(atob(base64url.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))

const save = (subscription: PushSubscription) => {
  const { endpoint, keys } = subscription.toJSON()
  return api.push.subscribe({ endpoint: endpoint!, keys: { p256dh: keys!.p256dh!, auth: keys!.auth! } })
}

export const push = {
  // 'ok' · 'install': iOS only allows push from the home-screen app · 'unsupported'
  get availability(): 'ok' | 'install' | 'unsupported' {
    if (supported()) return 'ok'
    return ios() && !install.installed ? 'install' : 'unsupported'
  },
  get permission() {
    return permission
  },
  get subscribed() {
    return subscribed
  },

  // Reads this device's state and re-sends an existing subscription, so the
  // API has it even if the user signed in again or the browser rotated it.
  async sync() {
    if (!supported()) return
    permission = Notification.permission
    const reg = await navigator.serviceWorker.getRegistration()
    const current = await reg?.pushManager.getSubscription()
    subscribed = !!current
    if (current) await save(current)
  },

  // Must run from a tap: browsers only show the permission prompt on a user gesture.
  async enable() {
    permission = await Notification.requestPermission()
    if (permission !== 'granted') return false
    const reg = await registration()
    const { publicKey } = await api.push.key()
    const subscription =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toBytes(publicKey) }))
    await save(subscription)
    subscribed = true
    return true
  },

  async disable() {
    const reg = await navigator.serviceWorker.getRegistration()
    const subscription = await reg?.pushManager.getSubscription()
    if (subscription) {
      await api.push.unsubscribe(subscription.endpoint).catch(() => {})
      await subscription.unsubscribe()
    }
    subscribed = false
  },
}
