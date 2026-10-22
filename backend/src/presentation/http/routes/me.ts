import { Hono } from 'hono'
import type { AppEnv } from '../container'
import { preferencesBody } from '../schemas'
import { validate } from '../validate'

export const meRoutes = new Hono<AppEnv>()
  .get('/', async (c) => {
    return c.json(await c.var.container.useCases.getMe.execute(c.var.userId))
  })
  .patch('/preferences', validate('json', preferencesBody), async (c) => {
    const user = await c.var.container.useCases.updatePreferences.execute(c.var.userId, c.req.valid('json'))
    return c.json(user)
  })
