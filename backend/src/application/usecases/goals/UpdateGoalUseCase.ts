import { InvalidError } from '../../../domain/errors'
import { isDay } from '../../../domain/models/day'
import type { Goal, GoalVisibility } from '../../../domain/models/goal'
import type { IGoalRepository } from '../../../domain/repositories/IGoalRepository'
import { assertTitle } from '../../../domain/rules/invariants'
import { requireGoal } from '../shared'

export type UpdateGoalInput = {
  title?: string
  why?: string | null
  targetDate?: string | null // null clears it; a later date extends the goal
  visibility?: GoalVisibility
}

export class UpdateGoalUseCase {
  constructor(private readonly goals: IGoalRepository) {}

  async execute(userId: string, goalId: string, input: UpdateGoalInput): Promise<Goal> {
    const goal = await requireGoal(this.goals, userId, goalId)
    if (input.targetDate && !isDay(input.targetDate)) throw new InvalidError('Target date must be YYYY-MM-DD')

    const next: Goal = {
      ...goal,
      title: input.title === undefined ? goal.title : assertTitle(input.title),
      why: input.why === undefined ? goal.why : input.why?.trim() || null,
      targetDate: input.targetDate === undefined ? goal.targetDate : input.targetDate,
      visibility: input.visibility ?? goal.visibility,
    }
    await this.goals.update(next)
    return next
  }
}
