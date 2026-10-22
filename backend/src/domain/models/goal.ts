import type { Day } from './day'

export const GOAL_STATUSES = ['active', 'completed', 'archived'] as const
export type GoalStatus = (typeof GOAL_STATUSES)[number]

export const GOAL_VISIBILITIES = ['private', 'friends'] as const
export type GoalVisibility = (typeof GOAL_VISIBILITIES)[number]

export type Goal = {
  id: string
  userId: string
  title: string
  why: string | null
  targetDate: Day | null
  status: GoalStatus
  visibility: GoalVisibility
  completedAt: Date | null
  createdAt: Date
}
