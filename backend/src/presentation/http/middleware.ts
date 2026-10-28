import { createMiddleware } from 'hono/factory'
import type { AppContainer, AppEnv, RootEnv } from './container'

// Builds the per-request container (Worker bindings only exist per request),
// then sends the request's analytics after the response, off the critical path.
export const withContainer = <Bindings extends object>(make: (env: Bindings) => AppContainer) =>
  createMiddleware<RootEnv<Bindings>>(async (c, next) => {
    const container = make(c.env)
    c.set('container', container)
    await next()
    const flushing = container.analytics.flush()
    try {
      c.executionCtx.waitUntil(flushing)
    } catch {
      await flushing // no execution context (tests)
    }
  })

export const requireSession = createMiddleware<AppEnv>(async (c, next) => {
  const userId = await c.var.container.session.currentUserId(c.req.raw.headers)
  if (!userId) return c.json({ error: { code: 'unauthorized', message: 'Sign in required' } }, 401)
  c.set('userId', userId)
  await next()
})
