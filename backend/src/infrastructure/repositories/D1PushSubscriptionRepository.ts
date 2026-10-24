import { and, eq } from 'drizzle-orm'
import type { PushSubscription } from '../../domain/models/push'
import type { IPushSubscriptionRepository } from '../../domain/repositories/IPushSubscriptionRepository'
import type { Db } from '../db/client'
import { pushSubscription } from '../db/schema'

const toSubscription = (row: typeof pushSubscription.$inferSelect): PushSubscription => ({
  userId: row.userId,
  endpoint: row.endpoint,
  keys: { p256dh: row.p256dh, auth: row.auth },
  createdAt: row.createdAt,
})

export class D1PushSubscriptionRepository implements IPushSubscriptionRepository {
  constructor(private readonly db: Db) {}

  async save(s: PushSubscription): Promise<void> {
    const values = { endpoint: s.endpoint, userId: s.userId, p256dh: s.keys.p256dh, auth: s.keys.auth, createdAt: s.createdAt }
    await this.db
      .insert(pushSubscription)
      .values(values)
      .onConflictDoUpdate({ target: pushSubscription.endpoint, set: values })
  }

  async remove(userId: string, endpoint: string): Promise<void> {
    await this.db
      .delete(pushSubscription)
      .where(and(eq(pushSubscription.userId, userId), eq(pushSubscription.endpoint, endpoint)))
  }

  async removeByEndpoint(endpoint: string): Promise<void> {
    await this.db.delete(pushSubscription).where(eq(pushSubscription.endpoint, endpoint))
  }

  async listByUser(userId: string): Promise<PushSubscription[]> {
    const rows = await this.db.select().from(pushSubscription).where(eq(pushSubscription.userId, userId))
    return rows.map(toSubscription)
  }

  async listUserIds(): Promise<string[]> {
    const rows = await this.db.selectDistinct({ userId: pushSubscription.userId }).from(pushSubscription)
    return rows.map((r) => r.userId)
  }
}
