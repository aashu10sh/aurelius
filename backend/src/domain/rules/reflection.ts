import { addDays, type Day, weekStart } from '../models/day'

// The weekly reflection opens on the week's last day (Sunday) and stays open
// through Monday, which still counts toward the week that just ended.
// Returns the start of the week that can be reflected on today, if any.
export const reflectionWeek = (today: Day): Day | null => {
  const start = weekStart(today)
  if (today === addDays(start, 6)) return start
  if (today === start) return addDays(start, -7)
  return null
}

// The Sunday the reflection for `today`'s week opens.
export const reflectionOpensOn = (today: Day): Day => addDays(weekStart(today), 6)
