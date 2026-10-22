import { and, asc, eq, gte, lte, sum } from 'drizzle-orm'
import type { Completion } from '../../domain/models/completion'
import type { Day } from '../../domain/models/day'
import type { ICompletionRepository } from '../../domain/repositories/ICompletionRepository'
import type { Db } from '../db/client'
import { completion } from '../db/schema'

const toCompletion = (row: typeof completion.$inferSelect): Completion => ({
  id: row.id,
  taskId: row.taskId,
  userId: row.userId,
  day: row.day,
  xpAwarded: row.xpAwarded,
  createdAt: row.createdAt,
})

export class D1CompletionRepository implements ICompletionRepository {
  constructor(private readonly db: Db) {}

  async findByTaskAndDay(taskId: string, day: Day): Promise<Completion | null> {
    const [row] = await this.db
      .select()
      .from(completion)
      .where(and(eq(completion.taskId, taskId), eq(completion.day, day)))
      .limit(1)
    return row ? toCompletion(row) : null
  }

  async listByUserBetween(userId: string, from: Day, to: Day): Promise<Completion[]> {
    const rows = await this.db
      .select()
      .from(completion)
      .where(and(eq(completion.userId, userId), gte(completion.day, from), lte(completion.day, to)))
      .orderBy(asc(completion.day))
    return rows.map(toCompletion)
  }

  async activeDays(userId: string): Promise<Day[]> {
    const rows = await this.db
      .selectDistinct({ day: completion.day })
      .from(completion)
      .where(eq(completion.userId, userId))
      .orderBy(asc(completion.day))
    return rows.map((r) => r.day)
  }

  async totalXp(userId: string): Promise<number> {
    const [row] = await this.db
      .select({ xp: sum(completion.xpAwarded) })
      .from(completion)
      .where(eq(completion.userId, userId))
    return Number(row?.xp ?? 0)
  }

  async create(c: Completion): Promise<void> {
    await this.db.insert(completion).values(c)
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(completion).where(eq(completion.id, id))
  }
}
