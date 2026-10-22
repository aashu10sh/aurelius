import { queryClient } from './api/queries'
import { authClient } from './auth'

type Session = Awaited<ReturnType<typeof authClient.getSession>>['data']

let cached: Promise<Session> | null = null

// The signed-in session, fetched once and reused by route guards.
export const currentSession = () => {
  cached ??= authClient.getSession().then(({ data }) => data ?? null)
  return cached
}

export const refreshSession = () => {
  cached = null
  return currentSession()
}

export const signOut = async () => {
  await authClient.signOut()
  cached = Promise.resolve(null)
  queryClient.clear()
}
