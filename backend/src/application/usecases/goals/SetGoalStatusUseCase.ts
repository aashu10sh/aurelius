import type { Goal, GoalStatus } from '../../../domain/models/goal'
import type { IGoalRepository } from '../../../domain/repositories/IGoalRepository'
import { transitionGoal } from '../../../domain/rules/invariants'
import type { IClock } from '../../ports/IClock'
import { requireGoal } from '../shared'

// Complete (+200 XP, derived), archive or reopen a goal. Completing is
// always the user's call; the app only suggests it.
export class SetGoalStatusUseCase {
  constructor(
    private readonly goals: IGoalRepository,
    private readonly clock: IClock,
  ) {}

  async execute(userId: string, goalId: string, status: GoalStatus): Promise<Goal> {
    const goal = await requireGoal(this.goals, userId, goalId)
    const next = transitionGoal(goal, status, this.clock.now())
    if (next !== goal) await this.goals.update(next)
    return next
  }
}
