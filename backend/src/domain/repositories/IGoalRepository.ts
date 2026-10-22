import type { Goal, GoalStatus } from '../models/goal'

export interface IGoalRepository {
  findById(id: string): Promise<Goal | null>
  listByUser(userId: string, statuses?: readonly GoalStatus[]): Promise<Goal[]>
  countByStatus(userId: string, status: GoalStatus): Promise<number>
  create(goal: Goal): Promise<void>
  update(goal: Goal): Promise<void>
}
