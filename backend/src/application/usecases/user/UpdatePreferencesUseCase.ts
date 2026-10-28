import { InvalidError } from '../../../domain/errors'
import type { User, UserPreferences } from '../../../domain/models/user'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository'
import type { IAnalytics } from '../../ports/IAnalytics'
import { requireUser } from '../shared'

const isTimeZone = (tz: string) => {
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

export class UpdatePreferencesUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly analytics: IAnalytics,
  ) {}

  async execute(userId: string, changes: Partial<UserPreferences>): Promise<User> {
    const user = await requireUser(this.users, userId)
    const next: UserPreferences = {
      timezone: changes.timezone ?? user.timezone,
      reminderTime: changes.reminderTime ?? user.reminderTime,
      dayStartHour: changes.dayStartHour ?? user.dayStartHour,
      analyticsEnabled: changes.analyticsEnabled ?? user.analyticsEnabled,
    }
    if (!isTimeZone(next.timezone)) throw new InvalidError('Unknown time zone')
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(next.reminderTime)) throw new InvalidError('Reminder time must be HH:MM')
    if (!Number.isInteger(next.dayStartHour) || next.dayStartHour < 0 || next.dayStartHour > 6) {
      throw new InvalidError('Day start hour must be 0–6')
    }
    const updated = await this.users.updatePreferences(userId, next)
    this.analytics.identify(userId, {
      timezone: updated.timezone,
      reminder_time: updated.reminderTime,
      day_start_hour: updated.dayStartHour,
    })
    return updated
  }
}
