import { and, eq } from 'drizzle-orm'
import type { Day } from '../../domain/models/day'
import type { IReminderLogRepository } from '../../domain/repositories/IReminderLogRepository'
import type { Db } from '../db/client'
import { reminderLog } from '../db/schema'

export class D1ReminderLogRepository implements IReminderLogRepository {
  constructor(private readonly db: Db) {}

  async claim(userId: string, day: Day): Promise<boolean> {
    const inserted = await this.db
      .insert(reminderLog)
      .values({ userId, day })
      .onConflictDoNothing()
      .returning({ userId: reminderLog.userId })
    return inserted.length > 0
  }

  async release(userId: string, day: Day): Promise<void> {
    await this.db.delete(reminderLog).where(and(eq(reminderLog.userId, userId), eq(reminderLog.day, day)))
  }
}
