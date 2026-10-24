import type { Notification } from '../../domain/models/push'
import type { IPushSubscriptionRepository } from '../../domain/repositories/IPushSubscriptionRepository'
import type { IPushSender } from '../ports/IPushSender'

export type NotifyResult = { sent: number; failed: number }

// Delivers a notification to every device a user subscribed, pruning dead ones.
// Any feature can notify through this; the daily reminder is the first.
export interface INotificationService {
  notify(userId: string, notification: Notification): Promise<NotifyResult>
}

export class NotificationService implements INotificationService {
  constructor(
    private readonly subscriptions: IPushSubscriptionRepository,
    private readonly sender: IPushSender,
  ) {}

  async notify(userId: string, notification: Notification): Promise<NotifyResult> {
    const subscriptions = await this.subscriptions.listByUser(userId)
    const results = await Promise.all(
      subscriptions.map(async (s) => {
        const result = await this.sender.send(s, notification)
        if (result === 'gone') await this.subscriptions.removeByEndpoint(s.endpoint)
        return result
      }),
    )
    return {
      sent: results.filter((r) => r === 'sent').length,
      failed: results.filter((r) => r === 'failed').length,
    }
  }
}
