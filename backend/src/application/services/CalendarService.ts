import { type Day, dayAt } from '../../domain/models/day'
import type { User } from '../../domain/models/user'
import type { IClock } from '../ports/IClock'

export interface ICalendarService {
  // The user's current local day.
  today(user: User): Day
  // The local day an instant falls on for the user.
  dayOf(user: User, instant: Date): Day
}

export class CalendarService implements ICalendarService {
  constructor(private readonly clock: IClock) {}

  today(user: User): Day {
    return this.dayOf(user, this.clock.now())
  }

  dayOf(user: User, instant: Date): Day {
    return dayAt(instant, user.timezone, user.dayStartHour)
  }
}
