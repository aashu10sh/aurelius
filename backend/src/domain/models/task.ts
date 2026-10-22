export const EFFORTS = ['light', 'medium', 'heavy'] as const
export type Effort = (typeof EFFORTS)[number]

export const CADENCE_TYPES = ['daily', 'weekly', 'monthly'] as const
export type CadenceType = (typeof CADENCE_TYPES)[number]

// `count` is times per period; always 1 for daily.
export type Cadence = { type: CadenceType; count: number }

export type Task = {
  id: string
  goalId: string
  title: string
  effort: Effort
  cadence: Cadence
  archived: boolean
  createdAt: Date
}
