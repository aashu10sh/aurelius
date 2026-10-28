import { addDays, type Day, dayRange, minDay, weekStart } from '../../../domain/models/day'
import type { Reflection } from '../../../domain/models/journal'
import type { ICompletionRepository } from '../../../domain/repositories/ICompletionRepository'
import type { IGoalRepository } from '../../../domain/repositories/IGoalRepository'
import type { IReflectionRepository } from '../../../domain/repositories/IReflectionRepository'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository'
import { reflectionOpensOn, reflectionWeek } from '../../../domain/rules/reflection'
import type { HeatmapDay } from '../progress/GetProgressUseCase'
import type { ICalendarService } from '../../services/CalendarService'
import type { IScoreService } from '../../services/ScoreService'
import { requireUser } from '../shared'

export type WeekView = {
  today: Day
  weekStart: Day // the week being reflected on: last week on Mondays, this week otherwise
  canReflect: boolean // Sunday, or Monday for the week that just ended
  opensOn: Day // the Sunday this week's reflection opens
  xp: number
  plannedXp: number
  consistency: number | null
  days: HeatmapDay[] // Monday–Sunday; days after today have status null
  goals: { id: string; title: string }[] // what the reflection rates
  reflection: Reflection | null
}

// Everything the weekly reflection screen shows.
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
    const [user, goals] = await Promise.all([
      requireUser(this.users, userId),
      this.goals.listByUser(userId, ['active']),
    ])
    const today = this.calendar.today(user)
    const open = reflectionWeek(today)
    const start = open ?? weekStart(today)
    const end = addDays(start, 6)

    const [completions, reflection, consistency, streak, plannedXp] = await Promise.all([
      this.completions.listByUserBetween(userId, start, minDay(end, today)),
      this.reflections.findByWeek(userId, start),
      this.score.consistency(user, goals, today),
      this.score.streak(user, today),
      this.score.plannedWeeklyXp(goals),
    ])

    const days = dayRange(start, end).map((day) => ({
      day,
      xp: completions.filter((c) => c.day === day).reduce((s, c) => s + c.xpAwarded, 0),
      status: streak.statuses.get(day) ?? null,
    }))

    return {
      today,
      weekStart: start,
      canReflect: open !== null,
      opensOn: reflectionOpensOn(start),
      xp: days.reduce((s, d) => s + d.xp, 0),
      plannedXp,
      consistency: consistency.overall.score,
      days,
      goals: goals.map((g) => ({ id: g.id, title: g.title })),
      reflection,
    }
  }
}
