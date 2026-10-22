import { eq, inArray } from 'drizzle-orm'
import type { Metric, MetricLog } from '../../domain/models/metric'
import type { IMetricRepository } from '../../domain/repositories/IMetricRepository'
import type { Db } from '../db/client'
import { metric, metricLog } from '../db/schema'

const toMetric = (row: typeof metric.$inferSelect): Metric => ({
  goalId: row.goalId,
  unit: row.unit,
  startValue: row.startValue,
  targetValue: row.targetValue,
  currentValue: row.currentValue,
})

export class D1MetricRepository implements IMetricRepository {
  constructor(private readonly db: Db) {}

  async findByGoalIds(goalIds: readonly string[]): Promise<Metric[]> {
    if (goalIds.length === 0) return []
    const rows = await this.db
      .select()
      .from(metric)
      .where(inArray(metric.goalId, [...goalIds]))
    return rows.map(toMetric)
  }

  async save(m: Metric): Promise<void> {
    await this.db
      .insert(metric)
      .values(m)
      .onConflictDoUpdate({
        target: metric.goalId,
        set: { unit: m.unit, startValue: m.startValue, targetValue: m.targetValue, currentValue: m.currentValue },
      })
  }

  async delete(goalId: string): Promise<void> {
    await this.db.delete(metric).where(eq(metric.goalId, goalId))
  }

  async addLog(log: MetricLog): Promise<void> {
    await this.db.insert(metricLog).values(log)
  }
}
