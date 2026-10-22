import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { username } from 'better-auth/plugins'
import type { Db } from '../db/client'
import * as schema from '../db/schema'

// Bindings only exist per request on Workers, so the instance is built per
// request. baseURL is left unset: it is inferred from the request, which
// arrives on the app's origin through the /api proxy.
export const createAuth = (db: Db, secret: string) =>
  betterAuth({
    secret,
    basePath: '/api/auth',
    database: drizzleAdapter(db, { provider: 'sqlite', schema }),
    emailAndPassword: { enabled: true },
    plugins: [username()],
    user: {
      additionalFields: {
        timezone: { type: 'string', defaultValue: 'UTC' },
        reminderTime: { type: 'string', defaultValue: '20:00' },
        dayStartHour: { type: 'number', defaultValue: 3 },
      },
    },
  })

export type Auth = ReturnType<typeof createAuth>
