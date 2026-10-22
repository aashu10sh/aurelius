import type { Day } from './day'

// One tick of a task on a day. xpAwarded is fixed at completion time, so a
// later effort change never rewrites history.
export type Completion = {
  id: string
  taskId: string
  userId: string
  day: Day
  xpAwarded: number
  createdAt: Date
}
