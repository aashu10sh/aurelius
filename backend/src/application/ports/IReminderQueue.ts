import type { Day } from '../../domain/models/day'

// One daily reminder to compose and send for a user's local `day`.
export type ReminderJob = { userId: string; day: Day }

export interface IReminderQueue {
  enqueue(jobs: readonly ReminderJob[]): Promise<void>
}
