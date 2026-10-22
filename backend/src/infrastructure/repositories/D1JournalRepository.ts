import { and, desc, eq } from 'drizzle-orm'
import type { Day } from '../../domain/models/day'
import type { JournalEntry } from '../../domain/models/journal'
import type { IJournalRepository } from '../../domain/repositories/IJournalRepository'
import type { Db } from '../db/client'
import { journalEntry } from '../db/schema'

const toEntry = (row: typeof journalEntry.$inferSelect): JournalEntry => ({
  userId: row.userId,
  day: row.day,
  mood: row.mood,
  body: row.body,
})

export class D1JournalRepository implements IJournalRepository {
  constructor(private readonly db: Db) {}

  async findByDay(userId: string, day: Day): Promise<JournalEntry | null> {
    const [row] = await this.db
      .select()
      .from(journalEntry)
      .where(and(eq(journalEntry.userId, userId), eq(journalEntry.day, day)))
      .limit(1)
    return row ? toEntry(row) : null
  }

  async list(userId: string, limit: number): Promise<JournalEntry[]> {
    const rows = await this.db
      .select()
      .from(journalEntry)
      .where(eq(journalEntry.userId, userId))
      .orderBy(desc(journalEntry.day))
      .limit(limit)
    return rows.map(toEntry)
  }

  async upsert(entry: JournalEntry): Promise<void> {
    await this.db
      .insert(journalEntry)
      .values(entry)
      .onConflictDoUpdate({
        target: [journalEntry.userId, journalEntry.day],
        set: { mood: entry.mood, body: entry.body },
      })
  }
}
