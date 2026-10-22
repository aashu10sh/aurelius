import { Hono } from 'hono'
import type { AppEnv } from '../container'
import { reflectionBody } from '../schemas'
import { validate } from '../validate'

// The three read-heavy screens: Today, Progress and the weekly reflection.
export const overviewRoutes = new Hono<AppEnv>()
  .get('/today', async (c) => {
    return c.json(await c.var.container.useCases.getToday.execute(c.var.userId))
  })
  .get('/progress', async (c) => {
    return c.json(await c.var.container.useCases.getProgress.execute(c.var.userId))
  })
  .get('/week', async (c) => {
    return c.json(await c.var.container.useCases.getWeek.execute(c.var.userId))
  })
  .put('/week/reflection', validate('json', reflectionBody), async (c) => {
    const result = await c.var.container.useCases.submitReflection.execute(c.var.userId, c.req.valid('json'))
    return c.json(result)
  })
