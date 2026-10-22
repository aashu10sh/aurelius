import { Hono } from 'hono'
import type { AppEnv } from '../container'
import { idParam, updateMilestoneBody } from '../schemas'
import { validate } from '../validate'

export const milestoneRoutes = new Hono<AppEnv>()
  .patch('/:id', validate('param', idParam), validate('json', updateMilestoneBody), async (c) => {
    const milestone = await c.var.container.useCases.updateMilestone.execute(
      c.var.userId,
      c.req.valid('param').id,
      c.req.valid('json'),
    )
    return c.json(milestone)
  })
  .delete('/:id', validate('param', idParam), async (c) => {
    await c.var.container.useCases.removeMilestone.execute(c.var.userId, c.req.valid('param').id)
    return c.body(null, 204)
  })
