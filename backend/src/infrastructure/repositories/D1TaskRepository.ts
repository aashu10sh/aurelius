import { asc, eq, inArray } from 'drizzle-orm'
import type { Task } from '../../domain/models/task'
import type { ITaskRepository } from '../../domain/repositories/ITaskRepository'
import type { Db } from '../db/client'
import { task } from '../db/schema'

const toTask = (row: typeof task.$inferSelect): Task => ({
  id: row.id,
  goalId: row.goalId,
  title: row.title,
  effort: row.effort,
  cadence: { type: row.cadenceType, count: row.cadenceCount },
  archived: row.archived,
  createdAt: row.createdAt,
})

const toRow = (t: Task) => ({
  id: t.id,
  goalId: t.goalId,
  title: t.title,
  effort: t.effort,
  cadenceType: t.cadence.type,
  cadenceCount: t.cadence.count,
  archived: t.archived,
  createdAt: t.createdAt,
})

export class D1TaskRepository implements ITaskRepository {
  constructor(private readonly db: Db) {}

  async findById(id: string): Promise<Task | null> {
    const [row] = await this.db.select().from(task).where(eq(task.id, id)).limit(1)
    return row ? toTask(row) : null
  }

  async listByGoalIds(goalIds: readonly string[]): Promise<Task[]> {
    if (goalIds.length === 0) return []
    const rows = await this.db
      .select()
      .from(task)
      .where(inArray(task.goalId, [...goalIds]))
      .orderBy(asc(task.createdAt))
    return rows.map(toTask)
  }

  async create(t: Task): Promise<void> {
    await this.db.insert(task).values(toRow(t))
  }

  async update(t: Task): Promise<void> {
    await this.db.update(task).set(toRow(t)).where(eq(task.id, t.id))
  }
}
