import { addDays, type Day } from '../../domain/models/day'
import type { Goal } from '../../domain/models/goal'
import type { User } from '../../domain/models/user'
import type { ICompletionRepository } from '../../domain/repositories/ICompletionRepository'
import type { IGoalRepository } from '../../domain/repositories/IGoalRepository'
import type { IMilestoneRepository } from '../../domain/repositories/IMilestoneRepository'
import type { IReflectionRepository } from '../../domain/repositories/IReflectionRepository'
import type { IRestDayRepository } from '../../domain/repositories/IRestDayRepository'
import type { ITaskRepository } from '../../domain/repositories/ITaskRepository'
import {
  type Consistency,
  CONSISTENCY_WINDOW_DAYS,
  goalConsistency,
  overallConsistency,
} from '../../domain/rules/consistency'
import { computeStreak, type Streak } from '../../domain/rules/streak'
import { plannedCount } from '../../domain/rules/cadence'
import { totalXp, XP_BY_EFFORT } from '../../domain/rules/xp'
import type { ICalendarService } from './CalendarService'

export type ConsistencyReport = {
  byGoal: Map<string, Consistency>
  overall: Consistency
}

// Loads what the scoring rules need and runs them; shared by every read view.
export interface IScoreService {
  consistency(user: User, goals: readonly Goal[], today: Day): Promise<ConsistencyReport>
  streak(user: User, today: Day): Promise<Streak>
  totalXp(userId: string): Promise<number>
  // XP a normal week plans across the goals' active tasks.
  plannedWeeklyXp(goals: readonly Goal[]): Promise<number>
}

export class ScoreService implements IScoreService {
  constructor(
    private readonly goals: IGoalRepository,
    private readonly tasks: ITaskRepository,
    private readonly completions: ICompletionRepository,
    private readonly milestones: IMilestoneRepository,
    private readonly reflections: IReflectionRepository,
    private readonly restDays: IRestDayRepository,
    private readonly calendar: ICalendarService,
  ) {}

  async consistency(user: User, goals: readonly Goal[], today: Day): Promise<ConsistencyReport> {
    const from = addDays(today, -(CONSISTENCY_WINDOW_DAYS - 1))
    const [tasks, completions, restDays] = await Promise.all([
      this.tasks.listByGoalIds(goals.map((g) => g.id)),
      this.completions.listByUserBetween(user.id, from, today),
      this.restDays.list(user.id, from, today),
    ])

    const byGoal = new Map<string, Consistency>()
    for (const goal of goals) {
      byGoal.set(
        goal.id,
        goalConsistency({
          today,
          goalStart: this.calendar.dayOf(user, goal.createdAt),
          tasks: tasks.filter((t) => t.goalId === goal.id),
          completions,
          restDays,
        }),
      )
    }
    return { byGoal, overall: overallConsistency([...byGoal.values()]) }
  }

  async streak(user: User, today: Day): Promise<Streak> {
    const [activeDays, restDays] = await Promise.all([
      this.completions.activeDays(user.id),
      this.restDays.list(user.id),
    ])
    return computeStreak({
      since: this.calendar.dayOf(user, user.createdAt),
      today,
      activeDays: new Set(activeDays),
      restDays: new Set(restDays),
    })
  }

  async totalXp(userId: string): Promise<number> {
    const [completionXp, milestonesDone, goalsCompleted, reflections] = await Promise.all([
      this.completions.totalXp(userId),
      this.milestones.countDone(userId),
      this.goals.countByStatus(userId, 'completed'),
      this.reflections.count(userId),
    ])
    return totalXp({ completionXp, milestonesDone, goalsCompleted, reflections })
  }

  async plannedWeeklyXp(goals: readonly Goal[]): Promise<number> {
    const tasks = await this.tasks.listByGoalIds(goals.map((g) => g.id))
    return tasks
      .filter((t) => !t.archived)
      .reduce((sum, t) => sum + XP_BY_EFFORT[t.effort] * plannedCount(t.cadence, 7, 0), 0)
  }
}
