import { type Day, dayRange } from '../models/day'

// active  – at least one completion
// rest    – planned rest day: keeps the streak, adds nothing
// grace   – a single miss: forgiven
// missed  – part of two misses in a row: the streak broke here
// pending – today with nothing done yet: still open
export type DayStatus = 'active' | 'rest' | 'grace' | 'missed' | 'pending'

export type StreakInput = {
  since: Day // first day of the account
  today: Day
  activeDays: ReadonlySet<Day>
  restDays: ReadonlySet<Day>
}

export type Streak = {
  current: number
  longest: number
  statuses: Map<Day, DayStatus>
}

// "Never miss twice": one missed day is forgiven, a second in a row ends the
// streak. The streak counts active days in the unbroken run.
export const computeStreak = ({ since, today, activeDays, restDays }: StreakInput): Streak => {
  const statuses = new Map<Day, DayStatus>()
  let run = 0
  let longest = 0
  let lastMiss: Day | null = null

  for (const day of dayRange(since, today)) {
    if (activeDays.has(day)) {
      statuses.set(day, 'active')
      run++
      lastMiss = null
    } else if (restDays.has(day)) {
      statuses.set(day, 'rest')
      lastMiss = null
    } else if (day === today) {
      statuses.set(day, 'pending')
    } else if (lastMiss === null) {
      statuses.set(day, 'grace')
      lastMiss = day
    } else {
      // Second miss in a row: the earlier grace day turns into a miss too.
      if (statuses.get(lastMiss) === 'grace') statuses.set(lastMiss, 'missed')
      statuses.set(day, 'missed')
      run = 0
      lastMiss = day
    }
    longest = Math.max(longest, run)
  }

  return { current: run, longest, statuses }
}
