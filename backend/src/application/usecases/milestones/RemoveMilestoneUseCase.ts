import { NotFoundError } from '../../../domain/errors'
import type { IGoalRepository } from '../../../domain/repositories/IGoalRepository'
import type { IMilestoneRepository } from '../../../domain/repositories/IMilestoneRepository'
import { requireGoal } from '../shared'

export class RemoveMilestoneUseCase {
  constructor(
    private readonly goals: IGoalRepository,
    private readonly milestones: IMilestoneRepository,
  ) {}

  async execute(userId: string, milestoneId: string): Promise<void> {
    const milestone = await this.milestones.findById(milestoneId)
    if (!milestone) throw new NotFoundError('Milestone')
    await requireGoal(this.goals, userId, milestone.goalId)
    await this.milestones.delete(milestone.id)
  }
}
