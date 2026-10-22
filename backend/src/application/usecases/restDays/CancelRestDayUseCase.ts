import { InvalidError } from '../../../domain/errors'
import type { IRestDayRepository } from '../../../domain/repositories/IRestDayRepository'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository'
import type { ICalendarService } from '../../services/CalendarService'
import { requireUser } from '../shared'

// Only upcoming rest days can be cancelled; past ones are history.
export class CancelRestDayUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly restDays: IRestDayRepository,
    private readonly calendar: ICalendarService,
  ) {}

  async execute(userId: string, day: string): Promise<void> {
    const user = await requireUser(this.users, userId)
    if (day <= this.calendar.today(user)) throw new InvalidError('Past rest days cannot be changed')
    await this.restDays.remove(userId, day)
  }
}
