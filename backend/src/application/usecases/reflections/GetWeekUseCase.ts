import { addDays, type Day, dayRange, weekStart } from '../../../domain/models/day'
import type { Reflection } from '../../../domain/models/journal'
import type { ICompletionRepository } from '../../../domain/repositories/ICompletionRepository'
import type { IGoalRepository } from '../../../domain/repositories/IGoalRepository'
import type { IReflectionRepository } from '../../../domain/repositories/IReflectionRepository'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository'
import type { HeatmapDay } from '../progress/GetProgressUseCase'
import type { ICalendarService } from '../../services/CalendarService'
import type { IScoreService } from '../../services/ScoreService'
import { requireUser } from '../shared'

export type WeekView = {
  weekStart: Day
  xp: number
  plannedXp: number
  consistency: number | null
  days: HeatmapDay[] // Monday–Sunday; days after today have status null
  goals: { id: string; title: string }[] // what the reflection rates
  reflection: Reflection | null
}

// Everything the weekly reflection screen shows, for the current week.
export class GetWeekUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly goals: IGoalRepository,
    private readonly completions: ICompletionRepository,
    private readonly reflections: IReflectionRepository,
    private readonly score: IScoreService,
    private readonly calendar: ICalendarService,
  ) {}

  async execute(userId: string): Promise<WeekView> {
    const user = await requireUser(this.users, userId)
    const today = this.calendar.today(user)
    const start = weekStart(today)
    const goals = await this.goals.listByUser(userId, ['active'])

    const [completions, reflection, consistency, streak, plannedXp] = await Promise.all([
      this.completions.listByUserBetween(userId, start, today),
      this.reflections.findByWeek(userId, start),
      this.score.consistency(user, goals, today),
      this.score.streak(user, today),
      this.score.plannedWeeklyXp(goals),
    ])

    const days = dayRange(start, addDays(start, 6)).map((day) => ({
      day,
      xp: completions.filter((c) => c.day === day).reduce((s, c) => s + c.xpAwarded, 0),
      status: streak.statuses.get(day) ?? null,
    }))

    return {
      weekStart: start,
      xp: days.reduce((s, d) => s + d.xp, 0),
      plannedXp,
      consistency: consistency.overall.score,
      days,
      goals: goals.map((g) => ({ id: g.id, title: g.title })),
      reflection,
    }
  }
}
