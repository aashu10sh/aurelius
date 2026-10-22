import { Hono } from 'hono'
import type { AppEnv } from '../container'
import { idParam, updateTaskBody } from '../schemas'
import { validate } from '../validate'

export const taskRoutes = new Hono<AppEnv>()
  .patch('/:id', validate('param', idParam), validate('json', updateTaskBody), async (c) => {
    const task = await c.var.container.useCases.updateTask.execute(
      c.var.userId,
      c.req.valid('param').id,
      c.req.valid('json'),
    )
    return c.json(task)
  })
  // Tick for today.
  .post('/:id/completion', validate('param', idParam), async (c) => {
    const completion = await c.var.container.useCases.completeTask.execute(c.var.userId, c.req.valid('param').id)
    return c.json(completion, 201)
  })
  // Un-tick today's completion.
  .delete('/:id/completion', validate('param', idParam), async (c) => {
    await c.var.container.useCases.undoCompletion.execute(c.var.userId, c.req.valid('param').id)
    return c.body(null, 204)
  })
