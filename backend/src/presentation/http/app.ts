import { Hono } from 'hono'
import type { AppContainer, AppEnv, RootEnv } from './container'
import { onError } from './errors'
import { requireSession, withContainer } from './middleware'
import { goalRoutes } from './routes/goals'
import { journalRoutes, restDayRoutes } from './routes/journal'
import { meRoutes } from './routes/me'
import { milestoneRoutes } from './routes/milestones'
import { overviewRoutes } from './routes/overview'
import { taskRoutes } from './routes/tasks'

// The HTTP API, mounted at /api (the PWA's worker forwards /api/* here on
// the same origin). Takes a container factory, so tests can pass fakes.
// No session needed: health check and the auth provider's own endpoints.
const publicRoutes = new Hono<AppEnv>()
  .get('/health', (c) => c.json({ ok: true }))
  .on(['GET', 'POST'], '/auth/*', (c) => c.var.container.handleAuth(c.req.raw))

export const createApp = <Bindings extends object>(makeContainer: (env: Bindings) => AppContainer) => {
  const api = new Hono<AppEnv>()
    .use(requireSession)
    .route('/me', meRoutes)
    .route('/', overviewRoutes)
    .route('/goals', goalRoutes)
    .route('/tasks', taskRoutes)
    .route('/milestones', milestoneRoutes)
    .route('/journal', journalRoutes)
    .route('/rest-days', restDayRoutes)

  return new Hono<RootEnv<Bindings>>()
    .basePath('/api')
    .onError(onError)
    .use(withContainer(makeContainer))
    .route('/', publicRoutes)
    .route('/', api)
}

export type ApiRoutes = ReturnType<typeof createApp>
