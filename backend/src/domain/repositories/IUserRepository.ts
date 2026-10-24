import type { User, UserPreferences } from '../models/user'

export interface IUserRepository {
  findById(id: string): Promise<User | null>
  findByIds(ids: readonly string[]): Promise<User[]>
  updatePreferences(id: string, preferences: UserPreferences): Promise<User>
}
