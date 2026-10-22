import { InvalidError } from '../../../domain/errors'
import type { User, UserPreferences } from '../../../domain/models/user'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository'
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
  constructor(private readonly users: IUserRepository) {}

  async execute(userId: string, changes: Partial<UserPreferences>): Promise<User> {
    const user = await requireUser(this.users, userId)
    const next: UserPreferences = {
      timezone: changes.timezone ?? user.timezone,
      reminderTime: changes.reminderTime ?? user.reminderTime,
      dayStartHour: changes.dayStartHour ?? user.dayStartHour,
    }
    if (!isTimeZone(next.timezone)) throw new InvalidError('Unknown time zone')
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(next.reminderTime)) throw new InvalidError('Reminder time must be HH:MM')
    if (!Number.isInteger(next.dayStartHour) || next.dayStartHour < 0 || next.dayStartHour > 6) {
      throw new InvalidError('Day start hour must be 0–6')
    }
    return this.users.updatePreferences(userId, next)
  }
}
