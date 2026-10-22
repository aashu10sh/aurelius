import { zValidator } from '@hono/zod-validator'
import type { ValidationTargets } from 'hono'
import type { ZodType } from 'zod'

// zValidator with the API's error shape: 400 { error: { code, message, issues } }.
export const validate = <T extends ZodType, Target extends keyof ValidationTargets>(target: Target, schema: T) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      const issues = result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
      return c.json({ error: { code: 'bad_request', message: 'Invalid request', issues } }, 400)
    }
  })
