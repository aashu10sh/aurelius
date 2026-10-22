import { and, asc, eq, gte, lte } from 'drizzle-orm'
import type { Day } from '../../domain/models/day'
import type { IRestDayRepository } from '../../domain/repositories/IRestDayRepository'
import type { Db } from '../db/client'
import { restDay } from '../db/schema'

export class D1RestDayRepository implements IRestDayRepository {
  constructor(private readonly db: Db) {}

  async list(userId: string, from?: Day, to?: Day): Promise<Day[]> {
    const rows = await this.db
      .select({ day: restDay.day })
      .from(restDay)
      .where(
        and(
          eq(restDay.userId, userId),
          from ? gte(restDay.day, from) : undefined,
          to ? lte(restDay.day, to) : undefined,
        ),
      )
      .orderBy(asc(restDay.day))
    return rows.map((r) => r.day)
  }

  async add(userId: string, day: Day): Promise<void> {
    await this.db.insert(restDay).values({ userId, day }).onConflictDoNothing()
  }

  async remove(userId: string, day: Day): Promise<void> {
    await this.db.delete(restDay).where(and(eq(restDay.userId, userId), eq(restDay.day, day)))
  }
}
