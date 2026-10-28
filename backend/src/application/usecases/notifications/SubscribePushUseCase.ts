import { InvalidError } from '../../../domain/errors'
import type { IPushSubscriptionRepository } from '../../../domain/repositories/IPushSubscriptionRepository'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository'
import type { IAnalytics } from '../../ports/IAnalytics'
import type { IClock } from '../../ports/IClock'
import { requireUser } from '../shared'

// Stores this browser's push subscription so reminders can reach it.
export class SubscribePushUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly subscriptions: IPushSubscriptionRepository,
    private readonly clock: IClock,
    private readonly analytics: IAnalytics,
  ) {}

  async execute(userId: string, input: { endpoint: string; keys: { p256dh: string; auth: string } }): Promise<void> {
    // Push services are always https; anything else would make us fetch arbitrary URLs.
    if (!URL.canParse(input.endpoint) || new URL(input.endpoint).protocol !== 'https:') {
      throw new InvalidError('Push endpoint must be an https URL')
    }
    const [, subscriptions] = await Promise.all([requireUser(this.users, userId), this.subscriptions.listByUser(userId)])
    const known = subscriptions.some((s) => s.endpoint === input.endpoint)
    await this.subscriptions.save({ userId, endpoint: input.endpoint, keys: input.keys, createdAt: this.clock.now() })
    // The app re-sends its subscription on every Settings visit; only count new devices.
    if (!known) this.analytics.track(userId, 'Push Subscribed', { push_service: new URL(input.endpoint).host })
  }
}
