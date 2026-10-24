import { InvalidError } from '../../../domain/errors'
import type { GoalRatings, Reflection, ReflectionAnswers } from '../../../domain/models/journal'
import type { IGoalRepository } from '../../../domain/repositories/IGoalRepository'
import type { IReflectionRepository } from '../../../domain/repositories/IReflectionRepository'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository'
import { assertScale } from '../../../domain/rules/invariants'
import { reflectionWeek } from '../../../domain/rules/reflection'
import type { ICalendarService } from '../../services/CalendarService'
import { requireUser } from '../shared'

// Saves the reflection for the week that is open (Sunday, or Monday for the
// week just ended). The first save of a week earns 20 XP (derived from the
// reflection existing); later edits earn nothing extra.
export class SubmitReflectionUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly goals: IGoalRepository,
    private readonly reflections: IReflectionRepository,
    private readonly calendar: ICalendarService,
  ) {}

  async execute(
    userId: string,
    input: { answers: ReflectionAnswers; goalRatings: GoalRatings },
  ): Promise<{ reflection: Reflection; firstThisWeek: boolean }> {
    const user = await requireUser(this.users, userId)
    const start = reflectionWeek(this.calendar.today(user))
    if (!start) throw new InvalidError('Weekly reflections open on Sunday')

    const goals = await this.goals.listByUser(userId, ['active'])
    const goalIds = new Set(goals.map((g) => g.id))

    for (const [goalId, { rating }] of Object.entries(input.goalRatings)) {
      if (!goalIds.has(goalId)) throw new InvalidError('Ratings must be for your active goals')
      assertScale(rating, 'Rating')
    }

    const existing = await this.reflections.findByWeek(userId, start)
    const reflection: Reflection = {
      userId,
      weekStart: start,
      answers: input.answers,
      goalRatings: input.goalRatings,
    }
    await this.reflections.upsert(reflection)
    return { reflection, firstThisWeek: existing === null }
  }
}
