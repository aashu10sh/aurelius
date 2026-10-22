import type { Day } from './day'

// At most one measurable target per goal, e.g. weight 82 → 77 kg.
export type Metric = {
  goalId: string
  unit: string
  startValue: number
  targetValue: number
  currentValue: number
}

export type MetricLog = {
  id: string
  goalId: string
  value: number
  loggedOn: Day
}
