import type { Milestone } from '../models/milestone'

export interface IMilestoneRepository {
  findById(id: string): Promise<Milestone | null>
  listByGoalIds(goalIds: readonly string[]): Promise<Milestone[]>
  countDone(userId: string): Promise<number>
  create(milestone: Milestone): Promise<void>
  update(milestone: Milestone): Promise<void>
  delete(id: string): Promise<void>
}
