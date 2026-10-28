import type { AnalyticsEventName, AnalyticsProps } from './IAnalytics'

export type AnalyticsEvent = {
  event: AnalyticsEventName
  userId: string
  time: Date
  insertId: string // lets the provider drop duplicates on retry
  properties: AnalyticsProps
}

export type AnalyticsProfile = { userId: string; set: AnalyticsProps }

// Where events end up (Mixpanel today). Implementations may throw; the
// AnalyticsService catches and logs.
export interface IAnalyticsSink {
  send(events: readonly AnalyticsEvent[], profiles: readonly AnalyticsProfile[]): Promise<void>
}
