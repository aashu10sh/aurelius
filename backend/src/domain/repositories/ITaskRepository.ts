import type { Task } from '../models/task'

export interface ITaskRepository {
  findById(id: string): Promise<Task | null>
  listByGoalIds(goalIds: readonly string[]): Promise<Task[]>
  create(task: Task): Promise<void>
  update(task: Task): Promise<void>
}
