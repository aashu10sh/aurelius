import { addDays } from '../../../domain/models/day'
import type { ICompletionRepository } from '../../../domain/repositories/ICompletionRepository'
import type { IGoalRepository } from '../../../domain/repositories/IGoalRepository'
import type { IReflectionRepository } from '../../../domain/repositories/IReflectionRepository'
import type { IReminderLogRepository } from '../../../domain/repositories/IReminderLogRepository'
import type { ITaskRepository } from '../../../domain/repositories/ITaskRepository'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository'
import { reflectionOpensOn, reflectionWeek } from '../../../domain/rules/reflection'
import { composeReminder } from '../../../domain/rules/reminder'
import type { IAnalytics } from '../../ports/IAnalytics'
import type { ReminderJob } from '../../ports/IReminderQueue'
import type { ICalendarService } from '../../services/CalendarService'
import type { INotificationService } from '../../services/NotificationService'
import type { IScoreService } from '../../services/ScoreService'

export type ReminderOutcome = 'sent' | 'skipped' | 'retry'

// Queue consumer: reads the user's state at send time and writes the message
// from it (streak at risk, easiest task, reflection day), or stays quiet.
export class SendReminderUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly goals: IGoalRepository,
    private readonly tasks: ITaskRepository,
    private readonly completions: ICompletionRepository,
    private readonly reflections: IReflectionRepository,
    private readonly log: IReminderLogRepository,
    private readonly score: IScoreService,
    private readonly notifications: INotificationService,
    private readonly calendar: ICalendarService,
    private readonly analytics: IAnalytics,
  ) {}

  async execute(job: ReminderJob): Promise<ReminderOutcome> {
    const user = await this.users.findById(job.userId)
    // Deleted account, or a message delivered so late that the day has moved on.
    if (!user || this.calendar.today(user) !== job.day) return 'skipped'
    if (!(await this.log.claim(user.id, job.day))) return 'skipped'

    const today = job.day
    const goals = await this.goals.listByUser(user.id, ['active'])
    const week = reflectionWeek(today)
    const [tasks, completions, streak, reflection] = await Promise.all([
      this.tasks.listByGoalIds(goals.map((g) => g.id)),
      this.completions.listByUserBetween(user.id, today, today),
      this.score.streak(user, today),
      week ? this.reflections.findByWeek(user.id, week) : null,
    ])

    const notification = composeReminder({
      doneToday: completions.length,
      tasks: tasks.filter((t) => !t.archived),
      streak: streak.current,
      yesterday: streak.statuses.get(addDays(today, -1)),
      reflection: !week || reflection ? null : today === reflectionOpensOn(week) ? 'open' : 'last-chance',
    })
    if (!notification) return 'skipped'

    const { sent, failed } = await this.notifications.notify(user.id, notification)
    if (sent > 0) {
      this.analytics.track(user.id, 'Reminder Sent', {
        kind: notification.tag,
        title: notification.title,
        devices: sent,
        streak: streak.current,
      })
    }
    if (sent === 0 && failed > 0) {
      await this.log.release(user.id, job.day)
      return 'retry'
    }
    return sent > 0 ? 'sent' : 'skipped'
  }
}
