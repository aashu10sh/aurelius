import type { Notification, PushSubscription } from '../../domain/models/push'

// 'gone': the push service no longer knows this subscription (404/410); drop it.
// 'failed': anything else (rate limit, outage); worth retrying later.
export type PushResult = 'sent' | 'gone' | 'failed'

export interface IPushSender {
  send(subscription: PushSubscription, notification: Notification): Promise<PushResult>
}
