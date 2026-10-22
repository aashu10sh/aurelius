import type { Completion } from '../models/completion'
import { addDays, type Day, daysBetween, maxDay } from '../models/day'
import type { Task } from '../models/task'
import { plannedCount } from './cadence'
import { XP_BY_EFFORT } from './xp'

export const CONSISTENCY_WINDOW_DAYS = 28

export type ConsistencyInput = {
  today: Day
  // First day the goal existed; a new goal is not penalised for days before it.
  goalStart: Day
  tasks: Task[]
  completions: Pick<Completion, 'taskId' | 'day' | 'xpAwarded'>[]
  restDays: Day[]
}

export type Consistency = {
  earnedXp: number
  plannedXp: number
  // 0–1, capped at 1; null when nothing is planned yet.
  score: number | null
}

// XP earned on a goal over the last 28 days ÷ XP its cadences planned.
// Being XP-based is what makes tasks OR'd: extra walks can cover a missed
// gym session, but light tasks cover less than heavy ones.
export const goalConsistency = (input: ConsistencyInput): Consistency => {
  const from = maxDay(addDays(input.today, -(CONSISTENCY_WINDOW_DAYS - 1)), input.goalStart)
  const days = daysBetween(from, input.today) + 1
  if (days <= 0) return { earnedXp: 0, plannedXp: 0, score: null }

  const restDays = input.restDays.filter((d) => d >= from && d <= input.today).length
  const taskIds = new Set(input.tasks.map((t) => t.id))

  const plannedXp = input.tasks
    .filter((t) => !t.archived)
    .reduce((sum, t) => sum + XP_BY_EFFORT[t.effort] * plannedCount(t.cadence, days, restDays), 0)

  const earnedXp = input.completions
    .filter((c) => taskIds.has(c.taskId) && c.day >= from && c.day <= input.today)
    .reduce((sum, c) => sum + c.xpAwarded, 0)

  return { earnedXp, plannedXp, score: scoreOf(earnedXp, plannedXp) }
}

// Overall consistency: the same ratio summed over every active goal.
export const overallConsistency = (goals: Consistency[]): Consistency => {
  const earnedXp = goals.reduce((s, g) => s + g.earnedXp, 0)
  const plannedXp = goals.reduce((s, g) => s + g.plannedXp, 0)
  return { earnedXp, plannedXp, score: scoreOf(earnedXp, plannedXp) }
}

const scoreOf = (earned: number, planned: number) => (planned > 0 ? Math.min(1, earned / planned) : null)
