import type { Day } from '../models/day'
import type { Reflection } from '../models/journal'

export interface IReflectionRepository {
  findByWeek(userId: string, weekStart: Day): Promise<Reflection | null>
  // Newest first.
  list(userId: string, limit: number): Promise<Reflection[]>
  count(userId: string): Promise<number>
  upsert(reflection: Reflection): Promise<void>
}
