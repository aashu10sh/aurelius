import { Hono } from 'hono'
import type { AppEnv } from '../container'
import { dayParam, journalBody, journalQuery } from '../schemas'
import { validate } from '../validate'

export const journalRoutes = new Hono<AppEnv>()
  .get('/', validate('query', journalQuery), async (c) => {
    return c.json(await c.var.container.useCases.listJournal.execute(c.var.userId, c.req.valid('query').limit))
  })
  .put('/', validate('json', journalBody), async (c) => {
    return c.json(await c.var.container.useCases.writeJournalEntry.execute(c.var.userId, c.req.valid('json')))
  })

export const restDayRoutes = new Hono<AppEnv>()
  .get('/', async (c) => {
    return c.json(await c.var.container.useCases.listRestDays.execute(c.var.userId))
  })
  .put('/:day', validate('param', dayParam), async (c) => {
    const day = await c.var.container.useCases.planRestDay.execute(c.var.userId, c.req.valid('param').day)
    return c.json({ day })
  })
  .delete('/:day', validate('param', dayParam), async (c) => {
    await c.var.container.useCases.cancelRestDay.execute(c.var.userId, c.req.valid('param').day)
    return c.body(null, 204)
  })
