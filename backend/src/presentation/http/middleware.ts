import { createMiddleware } from 'hono/factory'
import type { AppContainer, AppEnv, RootEnv } from './container'

// Builds the per-request container (Worker bindings only exist per request).
export const withContainer = <Bindings extends object>(make: (env: Bindings) => AppContainer) =>
  createMiddleware<RootEnv<Bindings>>(async (c, next) => {
    c.set('container', make(c.env))
    await next()
  })

export const requireSession = createMiddleware<AppEnv>(async (c, next) => {
  const userId = await c.var.container.session.currentUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: { code: 'unauthorized', message: 'Sign in required' } }, 401)
  c.set('userId', userId)
  await next()
})
