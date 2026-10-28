import { analytics } from './analytics'
import { forgetQueries } from './api/persist'
import { queryClient } from './api/queries'
import { authClient } from './auth'
import { push } from './push.svelte'

type Session = Awaited<ReturnType<typeof authClient.getSession>>['data']

// Remembers that this device was signed in, so a launch can open the app
// straight away and confirm the session alongside (see routes/_app/hooks.ts).
const HINT = 'aurelius:signed-in'

const remember = (signedIn: boolean) => {
  try {
    if (signedIn) localStorage.setItem(HINT, '1')
    else localStorage.removeItem(HINT)
  } catch {
    // Without storage every launch waits for the session check, as before.
  }
}

export const seemsSignedIn = () => {
  try {
    return localStorage.getItem(HINT) === '1'
  } catch {
    return false
  }
}

let cached: Promise<Session> | null = null

// The signed-in session, fetched once and reused by route guards.
export const currentSession = () => {
  // Read past the server's session cookie cache: it can hold user fields from
  // before a settings change (analyticsEnabled), which identify() acts on.
  cached ??= authClient
    .getSession({ query: { disableCookieCache: true } })
    .then(({ data, error }) => {
      if (data) analytics.identify(data.user)
      // A failed check (offline, server down) says nothing about the session.
      if (!error) remember(!!data)
      return data ?? null
    })
    .catch(() => null)
  return cached
}

export const refreshSession = () => {
  cached = null
  return currentSession()
}

// Drops everything this device knows about the signed-in user.
export const forgetSession = () => {
  remember(false)
  cached = Promise.resolve(null)
  queryClient.clear()
  forgetQueries()
}

export const signOut = async () => {
  // Stop this device getting the signed-out user's reminders.
  await push.disable().catch(() => {})
  await authClient.signOut()
  analytics.reset()
  forgetSession()
}
