import type { AnalyticsEvent, AnalyticsProfile, IAnalyticsSink } from '../../application/ports/IAnalyticsSink'

// Mixpanel's ingestion API takes up to 2000 events per /track call.
const BATCH = 2000

// Server-side events straight to Mixpanel's HTTP API. `ip=0` stops Mixpanel
// geolocating Cloudflare's IP as if it were the user's; location comes from
// the browser SDK instead.
export class MixpanelSink implements IAnalyticsSink {
  constructor(
    private readonly token: string,
    private readonly apiHost: string, // e.g. https://api-eu.mixpanel.com
  ) {}

  async send(events: readonly AnalyticsEvent[], profiles: readonly AnalyticsProfile[]): Promise<void> {
    const posts: Promise<void>[] = []
    for (let i = 0; i < events.length; i += BATCH) {
      posts.push(
        this.post(
          '/track?ip=0&strict=1',
          events.slice(i, i + BATCH).map((e) => ({
            event: e.event,
            properties: {
              ...e.properties,
              token: this.token,
              distinct_id: e.userId,
              time: e.time.getTime(),
              $insert_id: e.insertId,
              source: 'server',
            },
          })),
        ),
      )
    }
    if (profiles.length) {
      posts.push(
        this.post(
          '/engage?ip=0',
          profiles.map((p) => ({ $token: this.token, $distinct_id: p.userId, $set: p.set })),
        ),
      )
    }
    await Promise.all(posts)
  }

  private async post(path: string, body: unknown): Promise<void> {
    const response = await fetch(`${this.apiHost}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(body),
    })
    if (!response.ok) throw new Error(`Mixpanel ${path} ${response.status}: ${await response.text()}`)
  }
}

// No token configured (e.g. local dev without a dev project): drop everything.
export class NoopSink implements IAnalyticsSink {
  async send(): Promise<void> {}
}
