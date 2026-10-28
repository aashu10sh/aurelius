import type { IPushSubscriptionRepository } from '../../../domain/repositories/IPushSubscriptionRepository'
import type { IAnalytics } from '../../ports/IAnalytics'

export class UnsubscribePushUseCase {
  constructor(
    private readonly subscriptions: IPushSubscriptionRepository,
    private readonly analytics: IAnalytics,
  ) {}

  async execute(userId: string, endpoint: string): Promise<void> {
    await this.subscriptions.remove(userId, endpoint)
    this.analytics.track(userId, 'Push Unsubscribed', {})
  }
}
