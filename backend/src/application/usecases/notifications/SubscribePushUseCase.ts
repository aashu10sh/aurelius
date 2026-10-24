import { InvalidError } from '../../../domain/errors'
import type { IPushSubscriptionRepository } from '../../../domain/repositories/IPushSubscriptionRepository'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository'
import type { IClock } from '../../ports/IClock'
import { requireUser } from '../shared'

// Stores this browser's push subscription so reminders can reach it.
export class SubscribePushUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly subscriptions: IPushSubscriptionRepository,
    private readonly clock: IClock,
  ) {}

  async execute(userId: string, input: { endpoint: string; keys: { p256dh: string; auth: string } }): Promise<void> {
    await requireUser(this.users, userId)
    // Push services are always https; anything else would make us fetch arbitrary URLs.
    if (!URL.canParse(input.endpoint) || new URL(input.endpoint).protocol !== 'https:') {
      throw new InvalidError('Push endpoint must be an https URL')
    }
    await this.subscriptions.save({ userId, endpoint: input.endpoint, keys: input.keys, createdAt: this.clock.now() })
  }
}
