import type { Day } from '../models/day'
import type { JournalEntry } from '../models/journal'

export interface IJournalRepository {
  findByDay(userId: string, day: Day): Promise<JournalEntry | null>
  // Newest first.
  list(userId: string, limit: number): Promise<JournalEntry[]>
  upsert(entry: JournalEntry): Promise<void>
}
