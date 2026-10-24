import type { IPushSubscriptionRepository } from '../../../domain/repositories/IPushSubscriptionRepository'

export class UnsubscribePushUseCase {
  constructor(private readonly subscriptions: IPushSubscriptionRepository) {}

  async execute(userId: string, endpoint: string): Promise<void> {
    await this.subscriptions.remove(userId, endpoint)
  }
}
