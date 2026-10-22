import { type Day, minDay, monthStart, weekStart } from '../../../domain/models/day'
import type { Cadence, Effort } from '../../../domain/models/task'
import type { ICompletionRepository } from '../../../domain/repositories/ICompletionRepository'
import type { IGoalRepository } from '../../../domain/repositories/IGoalRepository'
import type { IJournalRepository } from '../../../domain/repositories/IJournalRepository'
import type { IMetricRepository } from '../../../domain/repositories/IMetricRepository'
import type { IMilestoneRepository } from '../../../domain/repositories/IMilestoneRepository'
import type { ITaskRepository } from '../../../domain/repositories/ITaskRepository'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository'
import { periodStart } from '../../../domain/rules/cadence'
import type { DayStatus } from '../../../domain/rules/streak'
import { XP_BY_EFFORT } from '../../../domain/rules/xp'
import type { ICalendarService } from '../../services/CalendarService'
import type { IScoreService } from '../../services/ScoreService'
import { requireUser } from '../shared'
import { type GoalSummary, toGoalSummary } from '../views'

export type TodayTask = {
  id: string
  title: string
  effort: Effort
  xp: number
  cadence: Cadence
  doneToday: boolean
  // Completions so far in the cadence period (today, this week, this month).
  periodDone: number
  periodTarget: number
}

export type TodayView = {
  day: Day
  name: string
  xpToday: number
  consistency: number | null
  streak: { current: number; longest: number; today: DayStatus }
  journalWritten: boolean
  goals: (GoalSummary & { tasks: TodayTask[] })[]
}

export class GetTodayUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly goals: IGoalRepository,
    private readonly tasks: ITaskRepository,
    private readonly completions: ICompletionRepository,
    private readonly milestones: IMilestoneRepository,
    private readonly metrics: IMetricRepository,
    private readonly journal: IJournalRepository,
    private readonly score: IScoreService,
    private readonly calendar: ICalendarService,
  ) {}

  async execute(userId: string): Promise<TodayView> {
    const user = await requireUser(this.users, userId)
    const today = this.calendar.today(user)
    const goals = await this.goals.listByUser(userId, ['active'])
    const ids = goals.map((g) => g.id)
    const periodFrom = minDay(weekStart(today), monthStart(today))

    const [tasks, completions, milestones, metrics, entry, consistency, streak] = await Promise.all([
      this.tasks.listByGoalIds(ids),
      this.completions.listByUserBetween(userId, periodFrom, today),
      this.milestones.listByGoalIds(ids),
      this.metrics.findByGoalIds(ids),
      this.journal.findByDay(userId, today),
      this.score.consistency(user, goals, today),
      this.score.streak(user, today),
    ])

    const todayTask = (task: (typeof tasks)[number]): TodayTask => {
      const from = periodStart(task.cadence.type, today)
      const mine = completions.filter((c) => c.taskId === task.id)
      return {
        id: task.id,
        title: task.title,
        effort: task.effort,
        xp: XP_BY_EFFORT[task.effort],
        cadence: task.cadence,
        doneToday: mine.some((c) => c.day === today),
        periodDone: mine.filter((c) => c.day >= from).length,
        periodTarget: task.cadence.count,
      }
    }

    return {
      day: today,
      name: user.name,
      xpToday: completions.filter((c) => c.day === today).reduce((s, c) => s + c.xpAwarded, 0),
      consistency: consistency.overall.score,
      streak: { current: streak.current, longest: streak.longest, today: streak.statuses.get(today) ?? 'pending' },
      journalWritten: entry !== null,
      goals: goals.map((g) => ({
        ...toGoalSummary(
          g,
          today,
          consistency.byGoal.get(g.id),
          milestones.filter((m) => m.goalId === g.id),
          metrics.find((m) => m.goalId === g.id),
        ),
        tasks: tasks.filter((t) => t.goalId === g.id && !t.archived).map(todayTask),
      })),
    }
  }
}
