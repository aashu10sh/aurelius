import { and, asc, count, eq, inArray, isNotNull } from 'drizzle-orm'
import type { Milestone } from '../../domain/models/milestone'
import type { IMilestoneRepository } from '../../domain/repositories/IMilestoneRepository'
import type { Db } from '../db/client'
import { goal, milestone } from '../db/schema'

const toMilestone = (row: typeof milestone.$inferSelect): Milestone => ({
  id: row.id,
  goalId: row.goalId,
  title: row.title,
  position: row.position,
  doneAt: row.doneAt,
})

export class D1MilestoneRepository implements IMilestoneRepository {
  constructor(private readonly db: Db) {}

  async findById(id: string): Promise<Milestone | null> {
    const [row] = await this.db.select().from(milestone).where(eq(milestone.id, id)).limit(1)
    return row ? toMilestone(row) : null
  }

  async listByGoalIds(goalIds: readonly string[]): Promise<Milestone[]> {
    if (goalIds.length === 0) return []
    const rows = await this.db
      .select()
      .from(milestone)
      .where(inArray(milestone.goalId, [...goalIds]))
      .orderBy(asc(milestone.position))
    return rows.map(toMilestone)
  }

  async countDone(userId: string): Promise<number> {
    const [row] = await this.db
      .select({ n: count() })
      .from(milestone)
      .innerJoin(goal, eq(milestone.goalId, goal.id))
      .where(and(eq(goal.userId, userId), isNotNull(milestone.doneAt)))
    return row?.n ?? 0
  }

  async create(m: Milestone): Promise<void> {
    await this.db.insert(milestone).values(m)
  }

  async update(m: Milestone): Promise<void> {
    await this.db
      .update(milestone)
      .set({ title: m.title, position: m.position, doneAt: m.doneAt })
      .where(eq(milestone.id, m.id))
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(milestone).where(eq(milestone.id, id))
  }
}
