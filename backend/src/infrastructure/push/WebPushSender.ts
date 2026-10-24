import { buildPushHTTPRequest } from '@pushforge/builder'
import type { IPushSender, PushResult } from '../../application/ports/IPushSender'
import type { Notification, PushSubscription } from '../../domain/models/push'

// A reminder is pointless tomorrow; let the push service drop it after 12 hours.
const TTL_SECONDS = 12 * 60 * 60

// Web Push (RFC 8030) with VAPID (RFC 8292) and aes128gcm payload encryption
// (RFC 8291), all on Web Crypto via @pushforge/builder, so it runs on Workers.
export class WebPushSender implements IPushSender {
  constructor(
    private readonly privateJwk: string, // the VAPID key pair as a JWK (includes the public x/y)
    private readonly subject: string, // 'mailto:…' or an https URL push services can contact
  ) {}

  async send(subscription: PushSubscription, notification: Notification): Promise<PushResult> {
    const { endpoint, headers, body } = await buildPushHTTPRequest({
      privateJWK: this.privateJwk,
      subscription: { endpoint: subscription.endpoint, keys: subscription.keys },
      message: {
        payload: notification,
        adminContact: this.subject as `mailto:${string}`,
        options: { ttl: TTL_SECONDS, topic: notification.tag, urgency: 'normal' },
      },
    })
    const response = await fetch(endpoint, { method: 'POST', headers, body })
    if (response.ok) return 'sent'
    if (response.status === 404 || response.status === 410) return 'gone'
    console.warn('push failed', { status: response.status, host: new URL(endpoint).host, body: await response.text() })
    return 'failed'
  }
}

// The browser needs the public half as an uncompressed P-256 point
// (0x04 ‖ x ‖ y), base64url, for PushManager.subscribe's applicationServerKey.
export const vapidPublicKey = (privateJwk: string): string => {
  const { x, y } = JSON.parse(privateJwk) as { x: string; y: string }
  const bytes = (b64url: string) => Uint8Array.from(atob(b64url.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))
  const point = new Uint8Array([4, ...bytes(x), ...bytes(y)])
  return btoa(String.fromCharCode(...point)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
