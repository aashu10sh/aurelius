// Browser-side product analytics (Mixpanel). The browser tracks screens and
// UI moments; what actually happened (ticks, level-ups, reflections) is
// tracked by the API, so the two never double-count. Both use the user id as
// the distinct id, so anonymous Welcome visits merge into the user on sign-in.
//
// The SDK loads lazily after first paint and sends through /mp on our own
// origin (mobile/worker/index.ts), so ad blockers don't drop events. With no
// token configured (dev without a dev project), every call is a no-op.
import type { Mixpanel, OverridedMixpanel } from 'mixpanel-browser'
import type { AnalyticsConfigResponse } from 'backend/contract'
import { request } from './api/http'

export type ClientEvent =
  | 'Screen Viewed'
  | 'Signed In'
  | 'Onboarding Step Viewed'
  | 'Onboarding Completed'
  | 'Install Card Shown'
  | 'Install Tapped'
  | 'App Installed'
  | 'Notification Permission'
  | 'Notification Opened'
  | 'Test Notification Sent'
  | 'Setting Changed'

type Props = Record<string, string | number | boolean | null>

let loading: Promise<Mixpanel | null> | null = null

const load = () =>
  (loading ??= (async () => {
    try {
      const { token } = await request<AnalyticsConfigResponse>('GET', '/analytics/config')
      if (!token) return null
      // The core build has no session recorder (~1 MB lighter). Its typings
      // re-export everything except the default instance, hence the cast.
      const core = (await import('mixpanel-browser/src/loaders/loader-module-core')) as unknown as { default: OverridedMixpanel }
      const mixpanel = core.default
      mixpanel.init(token, {
        api_host: `${location.origin}/mp`,
        persistence: 'localStorage',
        track_pageview: false, // a single-page app: screens are tracked below
        autocapture: false, // only deliberate events, no click noise
        record_sessions_percent: 0,
        debug: import.meta.env.DEV,
      })
      mixpanel.register({
        platform: 'web',
        display_mode: matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser',
      })
      return mixpanel
    } catch {
      return null // analytics must never break the app
    }
  })())

const withMixpanel = (fn: (mp: Mixpanel) => void) => {
  void load().then((mp) => {
    if (mp) fn(mp)
  })
}

// Route paths with ids collapse to their pattern: /goals/3f2… → /goals/:id.
const screenName = (pathname: string) =>
  pathname.replace(/\/[0-9a-f]{8}-[0-9a-f-]{27,}|\/[A-Za-z0-9_-]{20,}/g, '/:id') || '/'

export const analytics = {
  // Starts loading the SDK; called once from main.ts.
  start: () => void load(),

  track(event: ClientEvent, properties: Props = {}) {
    withMixpanel((mp) => mp.track(event, properties))
  },

  screen(pathname: string) {
    analytics.track('Screen Viewed', { screen: screenName(pathname) })
  },

  // Signed in (or the app opened with a session). `enabled` mirrors the
  // user's Share usage analytics setting, which the API also enforces.
  identify(user: { id: string; name: string; username?: string | null; analyticsEnabled?: boolean | null }) {
    withMixpanel((mp) => {
      if (user.analyticsEnabled === false) {
        mp.opt_out_tracking()
        return
      }
      if (mp.has_opted_out_tracking()) mp.opt_in_tracking()
      mp.identify(user.id)
      mp.people.set({ $name: user.name, username: user.username ?? null })
    })
  },

  // Signed out: a new anonymous id, so the next person on this device starts fresh.
  reset() {
    withMixpanel((mp) => mp.reset())
  },

  setEnabled(on: boolean) {
    withMixpanel((mp) => (on ? mp.opt_in_tracking() : mp.opt_out_tracking()))
  },
}
