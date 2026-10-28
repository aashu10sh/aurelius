import { z } from 'zod'
import { GOAL_STATUSES, GOAL_VISIBILITIES } from '../../domain/models/goal'
import { CADENCE_TYPES, EFFORTS } from '../../domain/models/task'

// Request shapes only. Business rules (cadence limits, transitions, …) are
// enforced by the domain, so they hold no matter which transport calls in.

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
const title = z.string().min(1).max(120)

export const idParam = z.object({ id: z.string().min(1) })
export const dayParam = z.object({ day })

const cadence = z.object({
  type: z.enum(CADENCE_TYPES),
  count: z.number().int().default(1),
})

const taskInput = z.object({ title, effort: z.enum(EFFORTS), cadence })

const metricInput = z.object({
  unit: z.string().min(1).max(20),
  startValue: z.number(),
  targetValue: z.number(),
})

export const listGoalsQuery = z.object({
  status: z
    .string()
    .optional()
    .transform((s) => (s ? s.split(',') : ['active']))
    .pipe(z.array(z.enum(GOAL_STATUSES))),
})

export const createGoalBody = z.object({
  title,
  why: z.string().max(280).nullish(),
  targetDate: day.nullish(),
  visibility: z.enum(GOAL_VISIBILITIES).optional(),
  tasks: z.array(taskInput).max(20).default([]),
  milestones: z.array(title).max(20).default([]),
  metric: metricInput.nullish(),
})

export const updateGoalBody = z.object({
  title: title.optional(),
  why: z.string().max(280).nullish(),
  targetDate: day.nullish(),
  visibility: z.enum(GOAL_VISIBILITIES).optional(),
})

export const goalStatusBody = z.object({ status: z.enum(GOAL_STATUSES) })

export const addTaskBody = taskInput

export const updateTaskBody = z.object({
  title: title.optional(),
  effort: z.enum(EFFORTS).optional(),
  cadence: cadence.optional(),
  archived: z.boolean().optional(),
})

export const addMilestoneBody = z.object({ title })

export const updateMilestoneBody = z.object({
  title: title.optional(),
  done: z.boolean().optional(),
})

// null removes the metric.
export const setMetricBody = metricInput.extend({ currentValue: z.number().optional() }).nullable()

export const logMetricBody = z.object({ value: z.number() })

export const preferencesBody = z.object({
  timezone: z.string().optional(),
  reminderTime: z.string().optional(),
  dayStartHour: z.number().int().optional(),
  analyticsEnabled: z.boolean().optional(),
})

export const journalBody = z.object({
  day: day.optional(),
  mood: z.number().int().nullish(),
  body: z.string().max(5000),
})

export const journalQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
})

export const reflectionBody = z.object({
  answers: z.object({
    forward: z.string().max(2000).optional(),
    blockers: z.string().max(2000).optional(),
    nextWeek: z.string().max(2000).optional(),
  }),
  goalRatings: z.record(z.string(), z.object({ rating: z.number().int(), note: z.string().max(500).optional() })),
})

export const pushSubscriptionBody = z.object({
  endpoint: z.string().max(2000),
  keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }),
})

export const pushEndpointBody = z.object({ endpoint: z.string().max(2000) })
