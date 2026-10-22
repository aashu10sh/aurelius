import { and, asc, count, eq, inArray } from 'drizzle-orm'
import type { Goal, GoalStatus } from '../../domain/models/goal'
import type { IGoalRepository } from '../../domain/repositories/IGoalRepository'
import type { Db } from '../db/client'
import { goal } from '../db/schema'

const toGoal = (row: typeof goal.$inferSelect): Goal => ({
  id: row.id,
  userId: row.userId,
  title: row.title,
  why: row.why,
  targetDate: row.targetDate,
  status: row.status,
  visibility: row.visibility,
  completedAt: row.completedAt,
  createdAt: row.createdAt,
})

const toRow = (g: Goal) => ({
  id: g.id,
  userId: g.userId,
  title: g.title,
  why: g.why,
  targetDate: g.targetDate,
  status: g.status,
  visibility: g.visibility,
  completedAt: g.completedAt,
  createdAt: g.createdAt,
})

export class D1GoalRepository implements IGoalRepository {
  constructor(private readonly db: Db) {}

  async findById(id: string): Promise<Goal | null> {
    const [row] = await this.db.select().from(goal).where(eq(goal.id, id)).limit(1)
    return row ? toGoal(row) : null
  }

  async listByUser(userId: string, statuses?: readonly GoalStatus[]): Promise<Goal[]> {
    const rows = await this.db
      .select()
      .from(goal)
      .where(and(eq(goal.userId, userId), statuses ? inArray(goal.status, [...statuses]) : undefined))
      .orderBy(asc(goal.createdAt))
    return rows.map(toGoal)
  }

  async countByStatus(userId: string, status: GoalStatus): Promise<number> {
    const [row] = await this.db
      .select({ n: count() })
      .from(goal)
      .where(and(eq(goal.userId, userId), eq(goal.status, status)))
    return row?.n ?? 0
  }

  async create(g: Goal): Promise<void> {
    await this.db.insert(goal).values(toRow(g))
  }

  async update(g: Goal): Promise<void> {
    await this.db.update(goal).set(toRow(g)).where(eq(goal.id, g.id))
  }
}
