import type { Day } from '../models/day'

export interface IRestDayRepository {
  // Inclusive range; omit both for all of the user's rest days.
  list(userId: string, from?: Day, to?: Day): Promise<Day[]>
  add(userId: string, day: Day): Promise<void>
  remove(userId: string, day: Day): Promise<void>
}
