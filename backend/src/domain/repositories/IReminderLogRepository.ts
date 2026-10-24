import type { Day } from '../models/day'

// At most one daily reminder per user per day, even if a queue message is delivered twice.
export interface IReminderLogRepository {
  // True if this call took the slot; false if the reminder was already sent.
  claim(userId: string, day: Day): Promise<boolean>
  // Gives the slot back after a failed send, so a retry can try again.
  release(userId: string, day: Day): Promise<void>
}
