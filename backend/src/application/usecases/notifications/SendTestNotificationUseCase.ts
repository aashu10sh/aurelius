import { InvalidError } from '../../../domain/errors'
import type { INotificationService, NotifyResult } from '../../services/NotificationService'

// "Send a test" in Settings: proves the whole path (keys, push service, service worker).
export class SendTestNotificationUseCase {
  constructor(private readonly notifications: INotificationService) {}

  async execute(userId: string): Promise<NotifyResult> {
    const result = await this.notifications.notify(userId, {
      title: 'Aurelius',
      body: 'Notifications are on. This is where your daily nudge will arrive.',
      url: '/settings',
      tag: 'test',
    })
    if (result.sent + result.failed === 0) throw new InvalidError('No device is subscribed to notifications')
    return result
  }
}
