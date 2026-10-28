import type { Day } from '../../../domain/models/day'
import type { Milestone } from '../../../domain/models/milestone'
import type { Task } from '../../../domain/models/task'
import type { IGoalRepository } from '../../../domain/repositories/IGoalRepository'
import type { IMetricRepository } from '../../../domain/repositories/IMetricRepository'
import type { IMilestoneRepository } from '../../../domain/repositories/IMilestoneRepository'
import type { IReflectionRepository } from '../../../domain/repositories/IReflectionRepository'
import type { ITaskRepository } from '../../../domain/repositories/ITaskRepository'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository'
import { XP_BY_EFFORT } from '../../../domain/rules/xp'
import type { ICalendarService } from '../../services/CalendarService'
import type { IScoreService } from '../../services/ScoreService'
import { requireGoal, requireUser } from '../shared'
import { type GoalSummary, toGoalSummary } from '../views'

const RATING_WEEKS = 6

export type GoalDetail = GoalSummary & {
  earnedXp: number // last 28 days
  plannedXp: number // last 28 days
  tasks: (Task & { xp: number })[]
  milestoneList: Milestone[]
  // Weekly "did the work move you closer?" answers, oldest first.
  ratings: { weekStart: Day; rating: number }[]
}

export class GetGoalUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly goals: IGoalRepository,
    private readonly tasks: ITaskRepository,
    private readonly milestones: IMilestoneRepository,
    private readonly metrics: IMetricRepository,
    private readonly reflections: IReflectionRepository,
    private readonly score: IScoreService,
    private readonly calendar: ICalendarService,
  ) {}

  async execute(userId: string, goalId: string): Promise<GoalDetail> {
    const [user, goal] = await Promise.all([
      requireUser(this.users, userId),
      requireGoal(this.goals, userId, goalId),
    ])
    const today = this.calendar.today(user)

    const [tasks, milestones, metrics, reflections, consistency] = await Promise.all([
      this.tasks.listByGoalIds([goal.id]),
      this.milestones.listByGoalIds([goal.id]),
      this.metrics.findByGoalIds([goal.id]),
      this.reflections.list(userId, RATING_WEEKS),
      this.score.consistency(user, [goal], today),
    ])
    const goalConsistency = consistency.byGoal.get(goal.id)

    return {
      ...toGoalSummary(goal, today, goalConsistency, milestones, metrics[0]),
      earnedXp: goalConsistency?.earnedXp ?? 0,
      plannedXp: goalConsistency?.plannedXp ?? 0,
      tasks: tasks.filter((t) => !t.archived).map((t) => ({ ...t, xp: XP_BY_EFFORT[t.effort] })),
      milestoneList: milestones.sort((a, b) => a.position - b.position),
      ratings: reflections
        .filter((r) => r.goalRatings[goal.id])
        .map((r) => ({ weekStart: r.weekStart, rating: r.goalRatings[goal.id]!.rating }))
        .reverse(),
    }
  }
}
