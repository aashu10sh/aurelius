import { InvalidError } from '../../../domain/errors'
import { addDays, type Day, isDay, weekStart } from '../../../domain/models/day'
import type { IRestDayRepository } from '../../../domain/repositories/IRestDayRepository'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository'
import { assertCanPlanRestDay } from '../../../domain/rules/restDay'
import type { ICalendarService } from '../../services/CalendarService'
import { requireUser } from '../shared'

export class PlanRestDayUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly restDays: IRestDayRepository,
    private readonly calendar: ICalendarService,
  ) {}

  async execute(userId: string, day: string): Promise<Day> {
    if (!isDay(day)) throw new InvalidError('Day must be YYYY-MM-DD')
    const user = await requireUser(this.users, userId)
    const start = weekStart(day)
    const planned = await this.restDays.list(userId, start, addDays(start, 6))
    assertCanPlanRestDay(day, this.calendar.today(user), planned)
    await this.restDays.add(userId, day)
    return day
  }
}
