import type { PushSubscription } from '../models/push'

export interface IPushSubscriptionRepository {
  // Insert, or move an existing endpoint to this user (a shared device).
  save(subscription: PushSubscription): Promise<void>
  remove(userId: string, endpoint: string): Promise<void>
  // The push service said the subscription is gone (404/410).
  removeByEndpoint(endpoint: string): Promise<void>
  listByUser(userId: string): Promise<PushSubscription[]>
  // Everyone with at least one subscription.
  listUserIds(): Promise<string[]>
}
