import type { z } from 'zod'
import type { Completion } from '../../domain/models/completion'
import type { Goal } from '../../domain/models/goal'
import type { JournalEntry, Reflection } from '../../domain/models/journal'
import type { Milestone } from '../../domain/models/milestone'
import type { Task } from '../../domain/models/task'
import type { User } from '../../domain/models/user'
import type { GoalDetail } from '../../application/usecases/goals/GetGoalUseCase'
import type { ProgressView } from '../../application/usecases/progress/GetProgressUseCase'
import type { WeekView } from '../../application/usecases/reflections/GetWeekUseCase'
import type { TodayView } from '../../application/usecases/today/GetTodayUseCase'
import type { GoalSummary, MetricView } from '../../application/usecases/views'
import type * as schemas from './schemas'

// The HTTP contract, for clients. Type-only: importing it ships no backend code.

// What a value looks like after JSON.stringify → JSON.parse.
export type Json<T> = T extends Date
  ? string
  : T extends readonly (infer U)[]
    ? Json<U>[]
    : T extends object
      ? { [K in keyof T]: Json<T[K]> }
      : T

export type ApiError = {
  error: { code: string; message: string; issues?: { path: string; message: string }[] }
}

// Responses
export type MeResponse = Json<User>
export type TodayResponse = Json<TodayView>
export type ProgressResponse = Json<ProgressView>
export type WeekResponse = Json<WeekView>
export type GoalSummaryResponse = Json<GoalSummary>
export type GoalDetailResponse = Json<GoalDetail>
export type GoalResponse = Json<Goal>
export type TaskResponse = Json<Task>
export type CompletionResponse = Json<Completion>
export type MilestoneResponse = Json<Milestone>
export type MetricResponse = Json<MetricView>
export type JournalResponse = Json<{ entries: JournalEntry[]; reflections: Reflection[] }>
export type JournalEntryResponse = Json<JournalEntry>
export type ReflectionResponse = Json<{ reflection: Reflection; firstThisWeek: boolean }>
export type PushKeyResponse = { publicKey: string }
export type PushTestResponse = { sent: number; failed: number }

// Requests
export type CreateGoalRequest = z.input<typeof schemas.createGoalBody>
export type UpdateGoalRequest = z.input<typeof schemas.updateGoalBody>
export type GoalStatusRequest = z.input<typeof schemas.goalStatusBody>
export type AddTaskRequest = z.input<typeof schemas.addTaskBody>
export type UpdateTaskRequest = z.input<typeof schemas.updateTaskBody>
export type UpdateMilestoneRequest = z.input<typeof schemas.updateMilestoneBody>
export type SetMetricRequest = z.input<typeof schemas.setMetricBody>
export type PreferencesRequest = z.input<typeof schemas.preferencesBody>
export type JournalRequest = z.input<typeof schemas.journalBody>
export type ReflectionRequest = z.input<typeof schemas.reflectionBody>
export type PushSubscriptionRequest = z.input<typeof schemas.pushSubscriptionBody>

export type { DayStatus } from '../../domain/rules/streak'
export type { Cadence, CadenceType, Effort } from '../../domain/models/task'
export type { GoalStatus } from '../../domain/models/goal'
