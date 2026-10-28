import type { Milestone } from '../../../domain/models/milestone'
import type { IGoalRepository } from '../../../domain/repositories/IGoalRepository'
import type { IMilestoneRepository } from '../../../domain/repositories/IMilestoneRepository'
import { assertTitle } from '../../../domain/rules/invariants'
import type { IIdGenerator } from '../../ports/IIdGenerator'
import { requireGoal } from '../shared'

export class AddMilestoneUseCase {
  constructor(
    private readonly goals: IGoalRepository,
    private readonly milestones: IMilestoneRepository,
    private readonly ids: IIdGenerator,
  ) {}

  async execute(userId: string, goalId: string, title: string): Promise<Milestone> {
    const [goal, existing] = await Promise.all([
      requireGoal(this.goals, userId, goalId),
      this.milestones.listByGoalIds([goalId]),
    ])
    const milestone: Milestone = {
      id: this.ids.next(),
      goalId: goal.id,
      title: assertTitle(title),
      position: existing.reduce((max, m) => Math.max(max, m.position + 1), 0),
      doneAt: null,
    }
    await this.milestones.create(milestone)
    return milestone
  }
}
