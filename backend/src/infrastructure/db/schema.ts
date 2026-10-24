import { sql } from 'drizzle-orm'
import { index, integer, primaryKey, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

const id = () => text('id').primaryKey().$defaultFn(() => crypto.randomUUID())
const createdAt = () =>
  integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`)
const updatedAt = () =>
  integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`)
    .$onUpdate(() => new Date())

// Local calendar day, 'YYYY-MM-DD', already shifted by the user's day_start_hour.
const day = (name = 'day') => text(name).notNull()

// ---------------------------------------------------------------------------
// Better Auth (core tables + username plugin + user preference fields)
// ---------------------------------------------------------------------------

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  username: text('username').unique(),
  displayUsername: text('display_username'),
  timezone: text('timezone').notNull().default('UTC'),
  reminderTime: text('reminder_time').notNull().default('20:00'),
  dayStartHour: integer('day_start_hour').notNull().default(3),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const session = sqliteTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    token: text('token').notNull().unique(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('session_user_idx').on(t.userId)],
)

export const account = sqliteTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp_ms' }),
    refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp_ms' }),
    scope: text('scope'),
    password: text('password'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('account_user_idx').on(t.userId)],
)

export const verification = sqliteTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('verification_identifier_idx').on(t.identifier)],
)

// ---------------------------------------------------------------------------
// Aurelius
// ---------------------------------------------------------------------------

export const goal = sqliteTable(
  'goal',
  {
    id: id(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    why: text('why'),
    targetDate: text('target_date'),
    status: text('status', { enum: ['active', 'completed', 'archived'] }).notNull().default('active'),
    visibility: text('visibility', { enum: ['private', 'friends'] }).notNull().default('private'),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('goal_user_status_idx').on(t.userId, t.status)],
)

// At most one metric per goal, so goal_id is the key.
export const metric = sqliteTable('metric', {
  goalId: text('goal_id')
    .primaryKey()
    .references(() => goal.id, { onDelete: 'cascade' }),
  unit: text('unit').notNull(),
  startValue: real('start_value').notNull(),
  targetValue: real('target_value').notNull(),
  currentValue: real('current_value').notNull(),
  updatedAt: updatedAt(),
})

export const metricLog = sqliteTable(
  'metric_log',
  {
    id: id(),
    goalId: text('goal_id')
      .notNull()
      .references(() => metric.goalId, { onDelete: 'cascade' }),
    value: real('value').notNull(),
    loggedOn: day('logged_on'),
    createdAt: createdAt(),
  },
  (t) => [index('metric_log_goal_idx').on(t.goalId, t.loggedOn)],
)

export const milestone = sqliteTable(
  'milestone',
  {
    id: id(),
    goalId: text('goal_id')
      .notNull()
      .references(() => goal.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    position: integer('position').notNull(),
    doneAt: integer('done_at', { mode: 'timestamp_ms' }),
    createdAt: createdAt(),
  },
  (t) => [index('milestone_goal_idx').on(t.goalId, t.position)],
)

export const task = sqliteTable(
  'task',
  {
    id: id(),
    goalId: text('goal_id')
      .notNull()
      .references(() => goal.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    effort: text('effort', { enum: ['light', 'medium', 'heavy'] }).notNull(),
    cadenceType: text('cadence_type', { enum: ['daily', 'weekly', 'monthly'] }).notNull(),
    // Times per cadence period; always 1 for daily.
    cadenceCount: integer('cadence_count').notNull().default(1),
    archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('task_goal_idx').on(t.goalId)],
)

export const completion = sqliteTable(
  'completion',
  {
    id: id(),
    taskId: text('task_id')
      .notNull()
      .references(() => task.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    day: day(),
    xpAwarded: integer('xp_awarded').notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    // One completion per task per day.
    uniqueIndex('completion_task_day_uq').on(t.taskId, t.day),
    index('completion_user_day_idx').on(t.userId, t.day),
  ],
)

export const restDay = sqliteTable(
  'rest_day',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    day: day(),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.day] })],
)

export const journalEntry = sqliteTable(
  'journal_entry',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    day: day(),
    mood: integer('mood'),
    body: text('body').notNull().default(''),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.day] })],
)

export const reflection = sqliteTable(
  'reflection',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    weekStart: day('week_start'),
    answers: text('answers', { mode: 'json' })
      .$type<{ forward?: string; blockers?: string; nextWeek?: string }>()
      .notNull(),
    goalRatings: text('goal_ratings', { mode: 'json' })
      .$type<Record<string, { rating: number; note?: string }>>()
      .notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.weekStart] })],
)

// ---------------------------------------------------------------------------
// Push notifications
// ---------------------------------------------------------------------------

export const pushSubscription = sqliteTable(
  'push_subscription',
  {
    endpoint: text('endpoint').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('push_subscription_user_idx').on(t.userId)],
)

// One row per daily reminder sent, so a redelivered queue message can't send twice.
export const reminderLog = sqliteTable(
  'reminder_log',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    day: day(),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.day] })],
)
