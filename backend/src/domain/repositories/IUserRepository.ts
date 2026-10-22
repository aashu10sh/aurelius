import type { User, UserPreferences } from '../models/user'

export interface IUserRepository {
  findById(id: string): Promise<User | null>
  updatePreferences(id: string, preferences: UserPreferences): Promise<User>
}
