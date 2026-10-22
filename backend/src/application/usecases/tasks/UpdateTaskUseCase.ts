import type { Cadence, Effort, Task } from '../../../domain/models/task'
import type { IGoalRepository } from '../../../domain/repositories/IGoalRepository'
import type { ITaskRepository } from '../../../domain/repositories/ITaskRepository'
import { assertTitle, normalizeCadence } from '../../../domain/rules/invariants'
import { requireTask } from '../shared'

// Archiving keeps the task's history and XP; it just stops being planned.
export type UpdateTaskInput = {
  title?: string
  effort?: Effort
  cadence?: Cadence
  archived?: boolean
}

export class UpdateTaskUseCase {
  constructor(
    private readonly goals: IGoalRepository,
    private readonly tasks: ITaskRepository,
  ) {}

  async execute(userId: string, taskId: string, input: UpdateTaskInput): Promise<Task> {
    const { task } = await requireTask(this.tasks, this.goals, userId, taskId)
    const next: Task = {
      ...task,
      title: input.title === undefined ? task.title : assertTitle(input.title),
      effort: input.effort ?? task.effort,
      cadence: input.cadence ? normalizeCadence(input.cadence) : task.cadence,
      archived: input.archived ?? task.archived,
    }
    await this.tasks.update(next)
    return next
  }
}
