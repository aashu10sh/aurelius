// Product analytics, as seen by use cases: record what happened, nothing
// else. Calls never throw and never wait on the network; the composition
// root flushes after the request (or job) so tracking can't slow or break it.

// Every server-side event, in one place so names can't drift. Client-side
// (UI) events live in mobile/src/lib/analytics.ts.
export type AnalyticsEventName =
  | 'Signed Up'
  | 'Goal Created'
  | 'Goal Status Changed'
  | 'Task Added'
  | 'Task Completed'
  | 'Task Uncompleted'
  | 'Milestone Completed'
  | 'Level Up'
  | 'Journal Entry Saved'
  | 'Reflection Submitted'
  | 'Rest Day Planned'
  | 'Push Subscribed'
  | 'Push Unsubscribed'
  | 'Reminder Sent'

export type AnalyticsProps = Record<string, string | number | boolean | null>

export interface IAnalytics {
  track(userId: string, event: AnalyticsEventName, properties?: AnalyticsProps): void
  // Sets profile properties (name, time zone…) on the user's analytics profile.
  identify(userId: string, profile: AnalyticsProps): void
  // Sends everything buffered so far. Safe to call more than once.
  flush(): Promise<void>
}
