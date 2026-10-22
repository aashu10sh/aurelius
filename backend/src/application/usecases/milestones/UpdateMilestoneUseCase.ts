import { NotFoundError } from '../../../domain/errors'
import type { Milestone } from '../../../domain/models/milestone'
import type { IGoalRepository } from '../../../domain/repositories/IGoalRepository'
import type { IMilestoneRepository } from '../../../domain/repositories/IMilestoneRepository'
import { assertTitle } from '../../../domain/rules/invariants'
import type { IClock } from '../../ports/IClock'
import { requireGoal } from '../shared'

// Rename, tick (+50 XP, derived) or un-tick a milestone.
export class UpdateMilestoneUseCase {
  constructor(
    private readonly goals: IGoalRepository,
    private readonly milestones: IMilestoneRepository,
    private readonly clock: IClock,
  ) {}

  async execute(userId: string, milestoneId: string, input: { title?: string; done?: boolean }): Promise<Milestone> {
    const milestone = await this.milestones.findById(milestoneId)
    if (!milestone) throw new NotFoundError('Milestone')
    await requireGoal(this.goals, userId, milestone.goalId)

    const doneAt =
      input.done === undefined ? milestone.doneAt : input.done ? (milestone.doneAt ?? this.clock.now()) : null
    const next: Milestone = {
      ...milestone,
      title: input.title === undefined ? milestone.title : assertTitle(input.title),
      doneAt,
    }
    await this.milestones.update(next)
    return next
  }
}
