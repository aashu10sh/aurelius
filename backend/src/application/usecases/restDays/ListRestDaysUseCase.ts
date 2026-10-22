import { addDays, type Day } from '../../../domain/models/day'
import type { IRestDayRepository } from '../../../domain/repositories/IRestDayRepository'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository'
import type { ICalendarService } from '../../services/CalendarService'
import { requireUser } from '../shared'

const UPCOMING_DAYS = 60

export class ListRestDaysUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly restDays: IRestDayRepository,
    private readonly calendar: ICalendarService,
  ) {}

  // Planned rest days from tomorrow on.
  async execute(userId: string): Promise<Day[]> {
    const user = await requireUser(this.users, userId)
    const today = this.calendar.today(user)
    return this.restDays.list(userId, addDays(today, 1), addDays(today, UPCOMING_DAYS))
  }
}
