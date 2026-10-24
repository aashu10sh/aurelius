import { Hono } from 'hono'
import type { AppEnv } from '../container'
import { pushEndpointBody, pushSubscriptionBody } from '../schemas'
import { validate } from '../validate'

export const pushRoutes = new Hono<AppEnv>()
  .get('/key', (c) => c.json({ publicKey: c.var.container.pushPublicKey() }))
  .put('/subscription', validate('json', pushSubscriptionBody), async (c) => {
    await c.var.container.useCases.subscribePush.execute(c.var.userId, c.req.valid('json'))
    return c.body(null, 204)
  })
  .delete('/subscription', validate('json', pushEndpointBody), async (c) => {
    await c.var.container.useCases.unsubscribePush.execute(c.var.userId, c.req.valid('json').endpoint)
    return c.body(null, 204)
  })
  .post('/test', async (c) => {
    return c.json(await c.var.container.useCases.sendTestNotification.execute(c.var.userId))
  })
