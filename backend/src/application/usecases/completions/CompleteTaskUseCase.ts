import { ConflictError, InvalidError } from '../../../domain/errors'
import type { Completion } from '../../../domain/models/completion'
import type { ICompletionRepository } from '../../../domain/repositories/ICompletionRepository'
import type { IGoalRepository } from '../../../domain/repositories/IGoalRepository'
import type { ITaskRepository } from '../../../domain/repositories/ITaskRepository'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository'
import { levelFor, XP_BY_EFFORT } from '../../../domain/rules/xp'
import type { IAnalytics } from '../../ports/IAnalytics'
import type { IClock } from '../../ports/IClock'
import type { IIdGenerator } from '../../ports/IIdGenerator'
import type { ICalendarService } from '../../services/CalendarService'
import type { IScoreService } from '../../services/ScoreService'
import { requireTask, requireUser } from '../shared'

// Ticks a task for today. At most once per task per day. Reports the new
// level when this tick crossed into one, so the app can celebrate it.
export class CompleteTaskUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly goals: IGoalRepository,
    private readonly tasks: ITaskRepository,
    private readonly completions: ICompletionRepository,
    private readonly calendar: ICalendarService,
    private readonly ids: IIdGenerator,
    private readonly clock: IClock,
    private readonly score: IScoreService,
    private readonly analytics: IAnalytics,
  ) {}

  async execute(userId: string, taskId: string): Promise<Completion & { levelUp: number | null }> {
    const user = await requireUser(this.users, userId)
    const { task, goal } = await requireTask(this.tasks, this.goals, userId, taskId)
    if (task.archived || goal.status !== 'active') throw new InvalidError('This task is no longer active')

    const day = this.calendar.today(user)
    const [existing, doneToday] = await Promise.all([
      this.completions.findByTaskAndDay(task.id, day),
      this.completions.listByUserBetween(userId, day, day),
    ])
    if (existing) {
      throw new ConflictError('Task already completed today')
    }

    const completion: Completion = {
      id: this.ids.next(),
      taskId: task.id,
      userId,
      day,
      xpAwarded: XP_BY_EFFORT[task.effort],
      createdAt: this.clock.now(),
    }
    const before = levelFor(await this.score.totalXp(userId)).level
    await this.completions.create(completion)
    const after = levelFor(await this.score.totalXp(userId)).level
    const levelUp = after > before ? after : null
    this.analytics.track(userId, 'Task Completed', {
      effort: task.effort,
      xp: completion.xpAwarded,
      cadence: task.cadence.type,
      first_of_day: doneToday.length === 0,
      level: after,
    })
    if (levelUp) this.analytics.track(userId, 'Level Up', { level: levelUp })
    return { ...completion, levelUp }
  }
}
