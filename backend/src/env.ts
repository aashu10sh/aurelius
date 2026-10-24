import type { ReminderJob } from './application/ports/IReminderQueue'

// Bindings declared on the Api worker in alchemy.run.ts; keep the two in sync.
export type Env = {
  DB: D1Database
  BETTER_AUTH_SECRET: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  REMINDERS: Queue<ReminderJob>
  VAPID_PRIVATE_KEY: string // JWK JSON, from `bunx @pushforge/builder vapid`
  VAPID_SUBJECT: string // 'mailto:…' contact for push services
}
