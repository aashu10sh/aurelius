import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { username } from 'better-auth/plugins'
import type { Db } from '../db/client'
import * as schema from '../db/schema'

export type AuthConfig = {
  secret: string
  google: { clientId: string; clientSecret: string }
}

// Bindings only exist per request on Workers, so the instance is built per
// request. The base URL comes from the request, which arrives on the app's
// origin through the /api proxy, so Google's redirect URI is
// <app origin>/api/auth/callback/google. Only the app's own hosts are
// accepted (local dev and the deployed app worker).
const allowedHosts = ['localhost:*', 'aurelius-app-*.workers.dev']
export const createAuth = (db: Db, config: AuthConfig) =>
  betterAuth({
    secret: config.secret,
    baseURL: { allowedHosts },
    basePath: '/api/auth',
    database: drizzleAdapter(db, { provider: 'sqlite', schema }),
    emailAndPassword: { enabled: true },
    socialProviders: {
      google: { ...config.google, prompt: 'select_account' },
    },
    account: {
      // One user, several ways in. Signing in with Google never attaches to
      // an existing password account on its own: sign-up emails aren't
      // verified, so anyone could have claimed that address first
      // (requireLocalEmailVerified, on by default). Users connect Google
      // from Settings while signed in instead, where proving both is
      // enough, so the Google address may differ from the account's.
      accountLinking: { enabled: true, allowDifferentEmails: true },
    },
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
