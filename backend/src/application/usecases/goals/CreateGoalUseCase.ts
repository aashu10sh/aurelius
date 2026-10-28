import { InvalidError } from '../../../domain/errors'
import { isDay } from '../../../domain/models/day'
import type { Goal, GoalVisibility } from '../../../domain/models/goal'
import type { Metric } from '../../../domain/models/metric'
import type { Milestone } from '../../../domain/models/milestone'
import type { Cadence, Effort, Task } from '../../../domain/models/task'
import type { IGoalRepository } from '../../../domain/repositories/IGoalRepository'
import type { IMetricRepository } from '../../../domain/repositories/IMetricRepository'
import type { IMilestoneRepository } from '../../../domain/repositories/IMilestoneRepository'
import type { ITaskRepository } from '../../../domain/repositories/ITaskRepository'
import { assertMetric, assertTitle, normalizeCadence } from '../../../domain/rules/invariants'
import type { IAnalytics } from '../../ports/IAnalytics'
import type { IClock } from '../../ports/IClock'
import type { IIdGenerator } from '../../ports/IIdGenerator'

export type CreateGoalInput = {
  title: string
  why?: string | null
  targetDate?: string | null
  visibility?: GoalVisibility
  tasks?: { title: string; effort: Effort; cadence: Cadence }[]
  milestones?: string[]
  metric?: { unit: string; startValue: number; targetValue: number } | null
}

// Creates a goal with its first tasks, milestones and metric in one go,
// which is what onboarding sends.
export class CreateGoalUseCase {
  constructor(
    private readonly goals: IGoalRepository,
    private readonly tasks: ITaskRepository,
    private readonly milestones: IMilestoneRepository,
    private readonly metrics: IMetricRepository,
    private readonly ids: IIdGenerator,
    private readonly clock: IClock,
    private readonly analytics: IAnalytics,
  ) {}

  async execute(userId: string, input: CreateGoalInput): Promise<Goal> {
    if (input.targetDate && !isDay(input.targetDate)) throw new InvalidError('Target date must be YYYY-MM-DD')
    const now = this.clock.now()

    const goal: Goal = {
      id: this.ids.next(),
      userId,
      title: assertTitle(input.title),
      why: input.why?.trim() || null,
      targetDate: input.targetDate ?? null,
      status: 'active',
      visibility: input.visibility ?? 'private',
      completedAt: null,
      createdAt: now,
    }
    const tasks: Task[] = (input.tasks ?? []).map((t) => ({
      id: this.ids.next(),
      goalId: goal.id,
      title: assertTitle(t.title),
      effort: t.effort,
      cadence: normalizeCadence(t.cadence),
      archived: false,
      createdAt: now,
    }))
    const milestones: Milestone[] = (input.milestones ?? []).map((title, position) => ({
      id: this.ids.next(),
      goalId: goal.id,
      title: assertTitle(title),
      position,
      doneAt: null,
    }))
    const metric: Metric | null = input.metric
      ? { goalId: goal.id, ...input.metric, unit: input.metric.unit.trim(), currentValue: input.metric.startValue }
      : null
    if (metric) assertMetric(metric)

    // Validate everything before writing anything.
    await this.goals.create(goal)
    await Promise.all([
      ...tasks.map((t) => this.tasks.create(t)),
      ...milestones.map((m) => this.milestones.create(m)),
      ...(metric ? [this.metrics.save(metric)] : []),
    ])
    this.analytics.track(userId, 'Goal Created', {
      tasks: tasks.length,
      milestones: milestones.length,
      has_metric: metric !== null,
      has_target_date: goal.targetDate !== null,
    })
    return goal
  }
}
