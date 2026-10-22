import { and, count, desc, eq } from 'drizzle-orm'
import type { Day } from '../../domain/models/day'
import type { Reflection } from '../../domain/models/journal'
import type { IReflectionRepository } from '../../domain/repositories/IReflectionRepository'
import type { Db } from '../db/client'
import { reflection } from '../db/schema'

const toReflection = (row: typeof reflection.$inferSelect): Reflection => ({
  userId: row.userId,
  weekStart: row.weekStart,
  answers: row.answers,
  goalRatings: row.goalRatings,
})

export class D1ReflectionRepository implements IReflectionRepository {
  constructor(private readonly db: Db) {}

  async findByWeek(userId: string, weekStart: Day): Promise<Reflection | null> {
    const [row] = await this.db
      .select()
      .from(reflection)
      .where(and(eq(reflection.userId, userId), eq(reflection.weekStart, weekStart)))
      .limit(1)
    return row ? toReflection(row) : null
  }

  async list(userId: string, limit: number): Promise<Reflection[]> {
    const rows = await this.db
      .select()
      .from(reflection)
      .where(eq(reflection.userId, userId))
      .orderBy(desc(reflection.weekStart))
      .limit(limit)
    return rows.map(toReflection)
  }

  async count(userId: string): Promise<number> {
    const [row] = await this.db.select({ n: count() }).from(reflection).where(eq(reflection.userId, userId))
    return row?.n ?? 0
  }

  async upsert(r: Reflection): Promise<void> {
    await this.db
      .insert(reflection)
      .values(r)
      .onConflictDoUpdate({
        target: [reflection.userId, reflection.weekStart],
        set: { answers: r.answers, goalRatings: r.goalRatings },
      })
  }
}
