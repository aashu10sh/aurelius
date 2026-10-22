import type { Metric, MetricLog } from '../models/metric'

export interface IMetricRepository {
  findByGoalIds(goalIds: readonly string[]): Promise<Metric[]>
  save(metric: Metric): Promise<void>
  delete(goalId: string): Promise<void>
  addLog(log: MetricLog): Promise<void>
}
