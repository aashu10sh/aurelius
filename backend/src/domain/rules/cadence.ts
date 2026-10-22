import { type Day, monthStart, weekStart } from '../models/day'
import type { Cadence, CadenceType } from '../models/task'

// First day of the cadence period containing `day`.
export const periodStart = (type: CadenceType, day: Day): Day => {
  switch (type) {
    case 'daily':
      return day
    case 'weekly':
      return weekStart(day)
    case 'monthly':
      return monthStart(day)
  }
}

// How many completions a cadence plans over a window of `days` days,
// e.g. 3×/week over 28 days = 12. Daily cadences skip planned rest days.
export const plannedCount = (cadence: Cadence, days: number, restDays: number): number => {
  switch (cadence.type) {
    case 'daily':
      return Math.max(0, days - restDays)
    case 'weekly':
      return (cadence.count * days) / 7
    case 'monthly':
      return (cadence.count * days) / 28
  }
}
