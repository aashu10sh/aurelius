import { type Day, daysBetween } from '../../domain/models/day'
import type { Goal } from '../../domain/models/goal'
import type { Metric } from '../../domain/models/metric'
import type { Milestone } from '../../domain/models/milestone'
import type { Consistency } from '../../domain/rules/consistency'
import { metricProgress } from '../../domain/rules/invariants'

// Read models returned by use cases. Plain data, safe to serialise as-is.

export type MetricView = Metric & { progress: number }

export type GoalSummary = {
  id: string
  title: string
  why: string | null
  status: Goal['status']
  visibility: Goal['visibility']
  targetDate: Day | null
  daysLeft: number | null
  consistency: number | null
  milestones: { done: number; total: number }
  metric: MetricView | null
}

export const toMetricView = (metric: Metric | undefined): MetricView | null =>
  metric ? { ...metric, progress: metricProgress(metric) } : null

export const toGoalSummary = (
  goal: Goal,
  today: Day,
  consistency: Consistency | undefined,
  milestones: readonly Milestone[],
  metric: Metric | undefined,
): GoalSummary => ({
  id: goal.id,
  title: goal.title,
  why: goal.why,
  status: goal.status,
  visibility: goal.visibility,
  targetDate: goal.targetDate,
  daysLeft: goal.targetDate ? daysBetween(today, goal.targetDate) : null,
  consistency: consistency?.score ?? null,
  milestones: {
    done: milestones.filter((m) => m.doneAt).length,
    total: milestones.length,
  },
  metric: toMetricView(metric),
})
