import { analytics } from './analytics'
import { queryClient } from './api/queries'
import { authClient } from './auth'
import { push } from './push.svelte'

type Session = Awaited<ReturnType<typeof authClient.getSession>>['data']

let cached: Promise<Session> | null = null

// The signed-in session, fetched once and reused by route guards.
export const currentSession = () => {
  cached ??= authClient.getSession().then(({ data }) => {
    if (data) analytics.identify(data.user)
    return data ?? null
  })
  return cached
}

export const refreshSession = () => {
  cached = null
  return currentSession()
}

export const signOut = async () => {
  // Stop this device getting the signed-out user's reminders.
  await push.disable().catch(() => {})
  await authClient.signOut()
  analytics.reset()
  cached = Promise.resolve(null)
  queryClient.clear()
}
