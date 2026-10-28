import { InvalidError } from '../../../domain/errors'
import { addDays, isDay } from '../../../domain/models/day'
import type { JournalEntry } from '../../../domain/models/journal'
import type { IJournalRepository } from '../../../domain/repositories/IJournalRepository'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository'
import { assertScale } from '../../../domain/rules/invariants'
import type { IAnalytics } from '../../ports/IAnalytics'
import type { ICalendarService } from '../../services/CalendarService'
import { requireUser } from '../shared'

const BACKFILL_DAYS = 7

// One entry per day; writing again replaces it. Entries are always private.
export class WriteJournalEntryUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly journal: IJournalRepository,
    private readonly calendar: ICalendarService,
    private readonly analytics: IAnalytics,
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
    // Never the text itself: only whether there was any, and roughly how much.
    this.analytics.track(userId, 'Journal Entry Saved', {
      has_mood: entry.mood !== null,
      words: entry.body ? entry.body.split(/\s+/).length : 0,
      backfilled: day !== today,
    })
    return entry
  }
}
