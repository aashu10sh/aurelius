import { InvalidError } from '../../../domain/errors'
import { addDays, isDay } from '../../../domain/models/day'
import type { JournalEntry } from '../../../domain/models/journal'
import type { IJournalRepository } from '../../../domain/repositories/IJournalRepository'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository'
import { assertScale } from '../../../domain/rules/invariants'
import type { ICalendarService } from '../../services/CalendarService'
import { requireUser } from '../shared'

const BACKFILL_DAYS = 7

// One entry per day; writing again replaces it. Entries are always private.
export class WriteJournalEntryUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly journal: IJournalRepository,
    private readonly calendar: ICalendarService,
  ) {}

  async execute(userId: string, input: { day?: string; mood?: number | null; body: string }): Promise<JournalEntry> {
    const user = await requireUser(this.users, userId)
    const today = this.calendar.today(user)
    const day = input.day ?? today
    if (!isDay(day)) throw new InvalidError('Day must be YYYY-MM-DD')
    if (day > today || day < addDays(today, -BACKFILL_DAYS)) {
      throw new InvalidError(`Entries can be written for today or the last ${BACKFILL_DAYS} days`)
    }
    if (input.mood != null) assertScale(input.mood, 'Mood')

    const entry: JournalEntry = { userId, day, mood: input.mood ?? null, body: input.body.trim() }
    await this.journal.upsert(entry)
    return entry
  }
}
