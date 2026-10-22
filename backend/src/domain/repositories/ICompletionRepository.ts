import type { Completion } from '../models/completion'
import type { Day } from '../models/day'

export interface ICompletionRepository {
  findByTaskAndDay(taskId: string, day: Day): Promise<Completion | null>
  // Inclusive day range, across all of the user's tasks.
  listByUserBetween(userId: string, from: Day, to: Day): Promise<Completion[]>
  // Every distinct day with at least one completion.
  activeDays(userId: string): Promise<Day[]>
  totalXp(userId: string): Promise<number>
  create(completion: Completion): Promise<void>
  delete(id: string): Promise<void>
}
