import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { username } from 'better-auth/plugins'
import type { IAnalytics } from '../../application/ports/IAnalytics'
import type { Db } from '../db/client'
import * as schema from '../db/schema'

export type AuthConfig = {
  secret: string
  google: { clientId: string; clientSecret: string }
  analytics: IAnalytics
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
    // Session checks (every API request) read a signed cookie instead of D1
    // for up to 5 minutes. The API only needs the user id from it; the app's
    // own session check bypasses the cache because it acts on user fields
    // (mobile/src/lib/session.ts). A session revoked on another device stays
    // usable for at most those 5 minutes.
    session: { cookieCache: { enabled: true, maxAge: 5 * 60 } },
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
    // Sign-up is the one event the auth library owns, so it's tracked here.
    databaseHooks: {
      user: {
        create: {
          after: async (user, ctx) => {
            config.analytics.identify(user.id, {
              $name: user.name,
              username: (user as { username?: string | null }).username ?? null,
              $created: user.createdAt.toISOString(),
            })
            config.analytics.track(user.id, 'Signed Up', { method: ctx?.path?.includes('google') ? 'google' : 'password' })
          },
        },
      },
    },
    user: {
      additionalFields: {
        timezone: { type: 'string', defaultValue: 'UTC' },
        reminderTime: { type: 'string', defaultValue: '20:00' },
        dayStartHour: { type: 'number', defaultValue: 3 },
        analyticsEnabled: { type: 'boolean', defaultValue: true, input: false },
      },
    },
  })

export type Auth = ReturnType<typeof createAuth>
