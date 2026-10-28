import type { GoalStatus } from '../../../domain/models/goal'
import type { IGoalRepository } from '../../../domain/repositories/IGoalRepository'
import type { IMetricRepository } from '../../../domain/repositories/IMetricRepository'
import type { IMilestoneRepository } from '../../../domain/repositories/IMilestoneRepository'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository'
import type { ICalendarService } from '../../services/CalendarService'
import type { IScoreService } from '../../services/ScoreService'
import { requireUser } from '../shared'
import { type GoalSummary, toGoalSummary } from '../views'

export class ListGoalsUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly goals: IGoalRepository,
    private readonly milestones: IMilestoneRepository,
    private readonly metrics: IMetricRepository,
    private readonly score: IScoreService,
    private readonly calendar: ICalendarService,
  ) {}

  async execute(userId: string, statuses: readonly GoalStatus[] = ['active']): Promise<GoalSummary[]> {
    const [user, goals] = await Promise.all([
      requireUser(this.users, userId),
      this.goals.listByUser(userId, statuses),
    ])
    const today = this.calendar.today(user)
    const ids = goals.map((g) => g.id)

    const [milestones, metrics, consistency] = await Promise.all([
      this.milestones.listByGoalIds(ids),
      this.metrics.findByGoalIds(ids),
      this.score.consistency(user, goals.filter((g) => g.status === 'active'), today),
    ])

    return goals.map((g) =>
      toGoalSummary(
        g,
        today,
        consistency.byGoal.get(g.id),
        milestones.filter((m) => m.goalId === g.id),
        metrics.find((m) => m.goalId === g.id),
      ),
    )
  }
}
