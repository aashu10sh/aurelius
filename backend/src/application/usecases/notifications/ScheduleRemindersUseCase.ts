import { minutesAt } from '../../../domain/models/day'
import type { IPushSubscriptionRepository } from '../../../domain/repositories/IPushSubscriptionRepository'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository'
import { isReminderDue } from '../../../domain/rules/reminder'
import type { IReminderQueue, ReminderJob } from '../../ports/IReminderQueue'
import type { ICalendarService } from '../../services/CalendarService'

// Runs on the cron tick: finds subscribed users whose reminder time falls in
// this window and queues one job each. Composing and sending happen in the
// consumer (SendReminderUseCase), so a slow push service can't stall the tick.
export class ScheduleRemindersUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly subscriptions: IPushSubscriptionRepository,
    private readonly queue: IReminderQueue,
    private readonly calendar: ICalendarService,
  ) {}

  // `at` is the tick's scheduled time, so a late start doesn't skip a window.
  async execute(at: Date): Promise<number> {
    const users = await this.users.findByIds(await this.subscriptions.listUserIds())
    const jobs: ReminderJob[] = users
      .filter((u) => isReminderDue(u.reminderTime, minutesAt(at, u.timezone)))
      .map((u) => ({ userId: u.id, day: this.calendar.dayOf(u, at) }))
    await this.queue.enqueue(jobs)
    return jobs.length
  }
}
