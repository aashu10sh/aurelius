import { InvalidError } from '../errors'
import type { Goal, GoalStatus } from '../models/goal'
import type { Metric } from '../models/metric'
import type { Cadence } from '../models/task'

export const assertTitle = (title: string): string => {
  const trimmed = title.trim()
  if (!trimmed) throw new InvalidError('Title is required')
  if (trimmed.length > 120) throw new InvalidError('Title is too long')
  return trimmed
}

const CADENCE_MAX: Record<Cadence['type'], number> = { daily: 1, weekly: 7, monthly: 31 }

export const normalizeCadence = (cadence: Cadence): Cadence => {
  if (cadence.type === 'daily') return { type: 'daily', count: 1 }
  const max = CADENCE_MAX[cadence.type]
  if (!Number.isInteger(cadence.count) || cadence.count < 1 || cadence.count > max) {
    throw new InvalidError(`A ${cadence.type} cadence runs 1–${max} times`)
  }
  return cadence
}

export const assertScale = (value: number, what: string) => {
  if (!Number.isInteger(value) || value < 1 || value > 5) throw new InvalidError(`${what} must be 1–5`)
}

// Allowed goal status changes. Completing stamps completedAt; reopening clears it.
const TRANSITIONS: Record<GoalStatus, readonly GoalStatus[]> = {
  active: ['completed', 'archived'],
  completed: ['active', 'archived'],
  archived: ['active'],
}

export const transitionGoal = (goal: Goal, to: GoalStatus, now: Date): Goal => {
  if (goal.status === to) return goal
  if (!TRANSITIONS[goal.status].includes(to)) {
    throw new InvalidError(`A ${goal.status} goal can't become ${to}`)
  }
  return { ...goal, status: to, completedAt: to === 'completed' ? now : null }
}

export const assertMetric = (metric: Metric) => {
  if (!metric.unit.trim()) throw new InvalidError('Metric unit is required')
  if (metric.startValue === metric.targetValue) throw new InvalidError('Metric start and target must differ')
}

// Share of the way from start to target, 0–1; works for "down to" and "up to" targets.
export const metricProgress = (m: Metric) =>
  Math.min(1, Math.max(0, (m.currentValue - m.startValue) / (m.targetValue - m.startValue)))
