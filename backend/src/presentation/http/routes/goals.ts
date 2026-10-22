import { Hono } from 'hono'
import type { AppEnv } from '../container'
import {
  addMilestoneBody,
  addTaskBody,
  createGoalBody,
  goalStatusBody,
  idParam,
  listGoalsQuery,
  logMetricBody,
  setMetricBody,
  updateGoalBody,
} from '../schemas'
import { validate } from '../validate'

export const goalRoutes = new Hono<AppEnv>()
  .get('/', validate('query', listGoalsQuery), async (c) => {
    const { status } = c.req.valid('query')
    return c.json(await c.var.container.useCases.listGoals.execute(c.var.userId, status))
  })
  .post('/', validate('json', createGoalBody), async (c) => {
    const goal = await c.var.container.useCases.createGoal.execute(c.var.userId, c.req.valid('json'))
    return c.json(goal, 201)
  })
  .get('/:id', validate('param', idParam), async (c) => {
    return c.json(await c.var.container.useCases.getGoal.execute(c.var.userId, c.req.valid('param').id))
  })
  .patch('/:id', validate('param', idParam), validate('json', updateGoalBody), async (c) => {
    const goal = await c.var.container.useCases.updateGoal.execute(
      c.var.userId,
      c.req.valid('param').id,
      c.req.valid('json'),
    )
    return c.json(goal)
  })
  .post('/:id/status', validate('param', idParam), validate('json', goalStatusBody), async (c) => {
    const goal = await c.var.container.useCases.setGoalStatus.execute(
      c.var.userId,
      c.req.valid('param').id,
      c.req.valid('json').status,
    )
    return c.json(goal)
  })
  .post('/:id/tasks', validate('param', idParam), validate('json', addTaskBody), async (c) => {
    const task = await c.var.container.useCases.addTask.execute(
      c.var.userId,
      c.req.valid('param').id,
      c.req.valid('json'),
    )
    return c.json(task, 201)
  })
  .post('/:id/milestones', validate('param', idParam), validate('json', addMilestoneBody), async (c) => {
    const milestone = await c.var.container.useCases.addMilestone.execute(
      c.var.userId,
      c.req.valid('param').id,
      c.req.valid('json').title,
    )
    return c.json(milestone, 201)
  })
  .put('/:id/metric', validate('param', idParam), validate('json', setMetricBody), async (c) => {
    const metric = await c.var.container.useCases.setMetric.execute(
      c.var.userId,
      c.req.valid('param').id,
      c.req.valid('json'),
    )
    return c.json(metric)
  })
  .post('/:id/metric/logs', validate('param', idParam), validate('json', logMetricBody), async (c) => {
    const metric = await c.var.container.useCases.logMetric.execute(
      c.var.userId,
      c.req.valid('param').id,
      c.req.valid('json').value,
    )
    return c.json(metric, 201)
  })
