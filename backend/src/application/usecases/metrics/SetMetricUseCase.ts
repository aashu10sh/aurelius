import type { Metric } from '../../../domain/models/metric'
import type { IGoalRepository } from '../../../domain/repositories/IGoalRepository'
import type { IMetricRepository } from '../../../domain/repositories/IMetricRepository'
import { assertMetric } from '../../../domain/rules/invariants'
import { requireGoal } from '../shared'
import { type MetricView, toMetricView } from '../views'

export type SetMetricInput = {
  unit: string
  startValue: number
  targetValue: number
  currentValue?: number
}

// Adds, replaces or (with null) removes a goal's measurable target.
export class SetMetricUseCase {
  constructor(
    private readonly goals: IGoalRepository,
    private readonly metrics: IMetricRepository,
  ) {}

  async execute(userId: string, goalId: string, input: SetMetricInput | null): Promise<MetricView | null> {
    const goal = await requireGoal(this.goals, userId, goalId)
    if (!input) {
      await this.metrics.delete(goal.id)
      return null
    }
    const metric: Metric = {
      goalId: goal.id,
      unit: input.unit.trim(),
      startValue: input.startValue,
      targetValue: input.targetValue,
      currentValue: input.currentValue ?? input.startValue,
    }
    assertMetric(metric)
    await this.metrics.save(metric)
    return toMetricView(metric)
  }
}
