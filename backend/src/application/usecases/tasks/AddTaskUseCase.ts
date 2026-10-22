import { InvalidError } from '../../../domain/errors'
import type { Cadence, Effort, Task } from '../../../domain/models/task'
import type { IGoalRepository } from '../../../domain/repositories/IGoalRepository'
import type { ITaskRepository } from '../../../domain/repositories/ITaskRepository'
import { assertTitle, normalizeCadence } from '../../../domain/rules/invariants'
import type { IClock } from '../../ports/IClock'
import type { IIdGenerator } from '../../ports/IIdGenerator'
import { requireGoal } from '../shared'

export type AddTaskInput = { title: string; effort: Effort; cadence: Cadence }

export class AddTaskUseCase {
  constructor(
    private readonly goals: IGoalRepository,
    private readonly tasks: ITaskRepository,
    private readonly ids: IIdGenerator,
    private readonly clock: IClock,
  ) {}

  async execute(userId: string, goalId: string, input: AddTaskInput): Promise<Task> {
    const goal = await requireGoal(this.goals, userId, goalId)
    if (goal.status !== 'active') throw new InvalidError('Tasks can only be added to an active goal')

    const task: Task = {
      id: this.ids.next(),
      goalId: goal.id,
      title: assertTitle(input.title),
      effort: input.effort,
      cadence: normalizeCadence(input.cadence),
      archived: false,
      createdAt: this.clock.now(),
    }
    await this.tasks.create(task)
    return task
  }
}
