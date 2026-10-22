import type { Day } from './day'

export type RestDay = { userId: string; day: Day }

export type JournalEntry = {
  userId: string
  day: Day
  mood: number | null // 1–5
  body: string
}

export type ReflectionAnswers = {
  forward?: string
  blockers?: string
  nextWeek?: string
}

// goalId → 1–5 answer to "did this week's work move you closer?"
export type GoalRatings = Record<string, { rating: number; note?: string }>

export type Reflection = {
  userId: string
  weekStart: Day
  answers: ReflectionAnswers
  goalRatings: GoalRatings
}
