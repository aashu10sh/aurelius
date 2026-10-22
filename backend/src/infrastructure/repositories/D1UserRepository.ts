import { eq } from 'drizzle-orm'
import { NotFoundError } from '../../domain/errors'
import type { User, UserPreferences } from '../../domain/models/user'
import type { IUserRepository } from '../../domain/repositories/IUserRepository'
import type { Db } from '../db/client'
import { user } from '../db/schema'

const toUser = (row: typeof user.$inferSelect): User => ({
  id: row.id,
  name: row.name,
  username: row.username,
  email: row.email,
  timezone: row.timezone,
  reminderTime: row.reminderTime,
  dayStartHour: row.dayStartHour,
  createdAt: row.createdAt,
})

// Users are created by Better Auth; this repository only reads them and
// updates Aurelius preferences.
export class D1UserRepository implements IUserRepository {
  constructor(private readonly db: Db) {}

  async findById(id: string): Promise<User | null> {
    const [row] = await this.db.select().from(user).where(eq(user.id, id)).limit(1)
    return row ? toUser(row) : null
  }

  async updatePreferences(id: string, preferences: UserPreferences): Promise<User> {
    const [row] = await this.db.update(user).set(preferences).where(eq(user.id, id)).returning()
    if (!row) throw new NotFoundError('User')
    return toUser(row)
  }
}
