import type { IUserRepository } from '../../domain/repositories/IUserRepository'
import type { AnalyticsEventName, AnalyticsProps, IAnalytics } from '../ports/IAnalytics'
import type { AnalyticsEvent, AnalyticsProfile, IAnalyticsSink } from '../ports/IAnalyticsSink'
import type { IClock } from '../ports/IClock'
import type { IIdGenerator } from '../ports/IIdGenerator'

// Buffers events for one request or job, then drops anything from users who
// turned analytics off (Settings → Share usage analytics) and sends the rest.
export class AnalyticsService implements IAnalytics {
  private events: AnalyticsEvent[] = []
  private profiles: AnalyticsProfile[] = []

  constructor(
    private readonly sink: IAnalyticsSink,
    private readonly users: IUserRepository,
    private readonly clock: IClock,
    private readonly ids: IIdGenerator,
  ) {}

  track(userId: string, event: AnalyticsEventName, properties: AnalyticsProps = {}): void {
    this.events.push({ event, userId, time: this.clock.now(), insertId: this.ids.next(), properties })
  }

  identify(userId: string, profile: AnalyticsProps): void {
    this.profiles.push({ userId, set: profile })
  }

  async flush(): Promise<void> {
    const events = this.events
    const profiles = this.profiles
    this.events = []
    this.profiles = []
    if (!events.length && !profiles.length) return
    try {
      const ids = [...new Set([...events, ...profiles].map((e) => e.userId))]
      const sharing = new Set((await this.users.findByIds(ids)).filter((u) => u.analyticsEnabled).map((u) => u.id))
      await this.sink.send(
        events.filter((e) => sharing.has(e.userId)),
        profiles.filter((p) => sharing.has(p.userId)),
      )
    } catch (error) {
      console.warn('analytics flush failed', { error: String(error) })
    }
  }
}
