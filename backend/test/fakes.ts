import type { IClock } from '../src/application/ports/IClock'
import type { IIdGenerator } from '../src/application/ports/IIdGenerator'
import type { IPushSender, PushResult } from '../src/application/ports/IPushSender'
import type { IReminderQueue, ReminderJob } from '../src/application/ports/IReminderQueue'
import type { Completion } from '../src/domain/models/completion'
import type { Day } from '../src/domain/models/day'
import type { Goal, GoalStatus } from '../src/domain/models/goal'
import type { JournalEntry, Reflection } from '../src/domain/models/journal'
import type { Metric, MetricLog } from '../src/domain/models/metric'
import type { Milestone } from '../src/domain/models/milestone'
import type { Notification, PushSubscription } from '../src/domain/models/push'
import type { Task } from '../src/domain/models/task'
import type { User, UserPreferences } from '../src/domain/models/user'
import type { ICompletionRepository } from '../src/domain/repositories/ICompletionRepository'
import type { IGoalRepository } from '../src/domain/repositories/IGoalRepository'
import type { IJournalRepository } from '../src/domain/repositories/IJournalRepository'
import type { IMetricRepository } from '../src/domain/repositories/IMetricRepository'
import type { IMilestoneRepository } from '../src/domain/repositories/IMilestoneRepository'
import type { IPushSubscriptionRepository } from '../src/domain/repositories/IPushSubscriptionRepository'
import type { IReflectionRepository } from '../src/domain/repositories/IReflectionRepository'
import type { IReminderLogRepository } from '../src/domain/repositories/IReminderLogRepository'
import type { IRestDayRepository } from '../src/domain/repositories/IRestDayRepository'
import type { ITaskRepository } from '../src/domain/repositories/ITaskRepository'
import type { IUserRepository } from '../src/domain/repositories/IUserRepository'

// In-memory implementations of every port, for use-case tests.

export class FixedClock implements IClock {
  constructor(public current: Date) {}
  now() {
    return this.current
  }
}

export class SequentialIds implements IIdGenerator {
  private n = 0
  next() {
    return `id-${++this.n}`
  }
}

export class InMemoryUserRepository implements IUserRepository {
  constructor(public rows: User[] = []) {}
  async findById(id: string) {
    return this.rows.find((u) => u.id === id) ?? null
  }
  async findByIds(ids: readonly string[]) {
    return this.rows.filter((u) => ids.includes(u.id))
  }
  async updatePreferences(id: string, preferences: UserPreferences) {
    const user = { ...(await this.findById(id))!, ...preferences }
    this.rows = this.rows.map((u) => (u.id === id ? user : u))
    return user
  }
}

export class InMemoryGoalRepository implements IGoalRepository {
  rows: Goal[] = []
  async findById(id: string) {
    return this.rows.find((g) => g.id === id) ?? null
  }
  async listByUser(userId: string, statuses?: readonly GoalStatus[]) {
    return this.rows.filter((g) => g.userId === userId && (!statuses || statuses.includes(g.status)))
  }
  async countByStatus(userId: string, status: GoalStatus) {
    return (await this.listByUser(userId, [status])).length
  }
  async create(goal: Goal) {
    this.rows.push(goal)
  }
  async update(goal: Goal) {
    this.rows = this.rows.map((g) => (g.id === goal.id ? goal : g))
  }
}

export class InMemoryTaskRepository implements ITaskRepository {
  rows: Task[] = []
  async findById(id: string) {
    return this.rows.find((t) => t.id === id) ?? null
  }
  async listByGoalIds(goalIds: readonly string[]) {
    return this.rows.filter((t) => goalIds.includes(t.goalId))
  }
  async create(task: Task) {
    this.rows.push(task)
  }
  async update(task: Task) {
    this.rows = this.rows.map((t) => (t.id === task.id ? task : t))
  }
}

export class InMemoryCompletionRepository implements ICompletionRepository {
  rows: Completion[] = []
  async findByTaskAndDay(taskId: string, day: Day) {
    return this.rows.find((c) => c.taskId === taskId && c.day === day) ?? null
  }
  async listByUserBetween(userId: string, from: Day, to: Day) {
    return this.rows.filter((c) => c.userId === userId && c.day >= from && c.day <= to)
  }
  async activeDays(userId: string) {
    return [...new Set(this.rows.filter((c) => c.userId === userId).map((c) => c.day))].sort()
  }
  async totalXp(userId: string) {
    return this.rows.filter((c) => c.userId === userId).reduce((s, c) => s + c.xpAwarded, 0)
  }
  async create(completion: Completion) {
    this.rows.push(completion)
  }
  async delete(id: string) {
    this.rows = this.rows.filter((c) => c.id !== id)
  }
}

export class InMemoryMilestoneRepository implements IMilestoneRepository {
  rows: Milestone[] = []
  constructor(private readonly goals: InMemoryGoalRepository) {}
  async findById(id: string) {
    return this.rows.find((m) => m.id === id) ?? null
  }
  async listByGoalIds(goalIds: readonly string[]) {
    return this.rows.filter((m) => goalIds.includes(m.goalId))
  }
  async countDone(userId: string) {
    const mine = new Set((await this.goals.listByUser(userId)).map((g) => g.id))
    return this.rows.filter((m) => mine.has(m.goalId) && m.doneAt).length
  }
  async create(milestone: Milestone) {
    this.rows.push(milestone)
  }
  async update(milestone: Milestone) {
    this.rows = this.rows.map((m) => (m.id === milestone.id ? milestone : m))
  }
  async delete(id: string) {
    this.rows = this.rows.filter((m) => m.id !== id)
  }
}

export class InMemoryMetricRepository implements IMetricRepository {
  rows: Metric[] = []
  logs: MetricLog[] = []
  async findByGoalIds(goalIds: readonly string[]) {
    return this.rows.filter((m) => goalIds.includes(m.goalId))
  }
  async save(metric: Metric) {
    this.rows = [...this.rows.filter((m) => m.goalId !== metric.goalId), metric]
  }
  async delete(goalId: string) {
    this.rows = this.rows.filter((m) => m.goalId !== goalId)
  }
  async addLog(log: MetricLog) {
    this.logs.push(log)
  }
}

export class InMemoryRestDayRepository implements IRestDayRepository {
  rows: { userId: string; day: Day }[] = []
  async list(userId: string, from?: Day, to?: Day) {
    return this.rows
      .filter((r) => r.userId === userId && (!from || r.day >= from) && (!to || r.day <= to))
      .map((r) => r.day)
      .sort()
  }
  async add(userId: string, day: Day) {
    if (!this.rows.some((r) => r.userId === userId && r.day === day)) this.rows.push({ userId, day })
  }
  async remove(userId: string, day: Day) {
    this.rows = this.rows.filter((r) => !(r.userId === userId && r.day === day))
  }
}

export class InMemoryJournalRepository implements IJournalRepository {
  rows: JournalEntry[] = []
  async findByDay(userId: string, day: Day) {
    return this.rows.find((e) => e.userId === userId && e.day === day) ?? null
  }
  async list(userId: string, limit: number) {
    return this.rows
      .filter((e) => e.userId === userId)
      .sort((a, b) => b.day.localeCompare(a.day))
      .slice(0, limit)
  }
  async upsert(entry: JournalEntry) {
    this.rows = [...this.rows.filter((e) => !(e.userId === entry.userId && e.day === entry.day)), entry]
  }
}

export class InMemoryReflectionRepository implements IReflectionRepository {
  rows: Reflection[] = []
  async findByWeek(userId: string, weekStart: Day) {
    return this.rows.find((r) => r.userId === userId && r.weekStart === weekStart) ?? null
  }
  async list(userId: string, limit: number) {
    return this.rows
      .filter((r) => r.userId === userId)
      .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
      .slice(0, limit)
  }
  async count(userId: string) {
    return this.rows.filter((r) => r.userId === userId).length
  }
  async upsert(reflection: Reflection) {
    this.rows = [
      ...this.rows.filter((r) => !(r.userId === reflection.userId && r.weekStart === reflection.weekStart)),
      reflection,
    ]
  }
}

export class InMemoryPushSubscriptionRepository implements IPushSubscriptionRepository {
  rows: PushSubscription[] = []
  async save(subscription: PushSubscription) {
    this.rows = [...this.rows.filter((s) => s.endpoint !== subscription.endpoint), subscription]
  }
  async remove(userId: string, endpoint: string) {
    this.rows = this.rows.filter((s) => !(s.userId === userId && s.endpoint === endpoint))
  }
  async removeByEndpoint(endpoint: string) {
    this.rows = this.rows.filter((s) => s.endpoint !== endpoint)
  }
  async listByUser(userId: string) {
    return this.rows.filter((s) => s.userId === userId)
  }
  async listUserIds() {
    return [...new Set(this.rows.map((s) => s.userId))]
  }
}

export class InMemoryReminderLogRepository implements IReminderLogRepository {
  rows = new Set<string>()
  async claim(userId: string, day: Day) {
    const key = `${userId}:${day}`
    if (this.rows.has(key)) return false
    this.rows.add(key)
    return true
  }
  async release(userId: string, day: Day) {
    this.rows.delete(`${userId}:${day}`)
  }
}

// Records what was sent; `results` overrides the outcome per endpoint.
export class FakePushSender implements IPushSender {
  sent: { endpoint: string; notification: Notification }[] = []
  results = new Map<string, PushResult>()
  async send(subscription: PushSubscription, notification: Notification) {
    const result = this.results.get(subscription.endpoint) ?? 'sent'
    if (result === 'sent') this.sent.push({ endpoint: subscription.endpoint, notification })
    return result
  }
}

export class FakeReminderQueue implements IReminderQueue {
  jobs: ReminderJob[] = []
  async enqueue(jobs: readonly ReminderJob[]) {
    this.jobs.push(...jobs)
  }
}
