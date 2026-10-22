import { addDays, type Day, dayRange, weekStart } from '../../../domain/models/day'
import type { ICompletionRepository } from '../../../domain/repositories/ICompletionRepository'
import type { IGoalRepository } from '../../../domain/repositories/IGoalRepository'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository'
import type { DayStatus } from '../../../domain/rules/streak'
import { type LevelProgress, levelFor } from '../../../domain/rules/xp'
import type { ICalendarService } from '../../services/CalendarService'
import type { IScoreService } from '../../services/ScoreService'
import { requireUser } from '../shared'

export const HEATMAP_WEEKS = 26
export const XP_HISTORY_WEEKS = 8

export type HeatmapDay = {
  day: Day
  xp: number
  // null before the account existed.
  status: DayStatus | null
}

export type ProgressView = {
  level: LevelProgress
  consistency: number | null
  streak: { current: number; longest: number }
  plannedWeeklyXp: number
  // Whole weeks, Monday first, ending with the current (partial) week.
  heatmap: HeatmapDay[]
  // Oldest first, current week last.
  weeklyXp: { weekStart: Day; xp: number }[]
}

export class GetProgressUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly goals: IGoalRepository,
    private readonly completions: ICompletionRepository,
    private readonly score: IScoreService,
    private readonly calendar: ICalendarService,
  ) {}

  async execute(userId: string): Promise<ProgressView> {
    const user = await requireUser(this.users, userId)
    const today = this.calendar.today(user)
    const thisWeek = weekStart(today)
    const from = addDays(thisWeek, -7 * (HEATMAP_WEEKS - 1))
    const goals = await this.goals.listByUser(userId, ['active'])

    const [xp, consistency, streak, plannedWeeklyXp, completions] = await Promise.all([
      this.score.totalXp(userId),
      this.score.consistency(user, goals, today),
      this.score.streak(user, today),
      this.score.plannedWeeklyXp(goals),
      this.completions.listByUserBetween(userId, from, today),
    ])

    const xpByDay = new Map<Day, number>()
    for (const c of completions) xpByDay.set(c.day, (xpByDay.get(c.day) ?? 0) + c.xpAwarded)

    const weeklyXp = Array.from({ length: XP_HISTORY_WEEKS }, (_, i) => {
      const start = addDays(thisWeek, -7 * (XP_HISTORY_WEEKS - 1 - i))
      const xp = dayRange(start, addDays(start, 6)).reduce((s, d) => s + (xpByDay.get(d) ?? 0), 0)
      return { weekStart: start, xp }
    })

    return {
      level: levelFor(xp),
      consistency: consistency.overall.score,
      streak: { current: streak.current, longest: streak.longest },
      plannedWeeklyXp,
      heatmap: dayRange(from, today).map((day) => ({
        day,
        xp: xpByDay.get(day) ?? 0,
        status: streak.statuses.get(day) ?? null,
      })),
      weeklyXp,
    }
  }
}
