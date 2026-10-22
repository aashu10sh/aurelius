import { NotFoundError } from '../../../domain/errors'
import type { ICompletionRepository } from '../../../domain/repositories/ICompletionRepository'
import type { IGoalRepository } from '../../../domain/repositories/IGoalRepository'
import type { ITaskRepository } from '../../../domain/repositories/ITaskRepository'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository'
import type { ICalendarService } from '../../services/CalendarService'
import { requireTask, requireUser } from '../shared'

// Un-ticks a task. Only today's completion can be undone.
export class UndoCompletionUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly goals: IGoalRepository,
    private readonly tasks: ITaskRepository,
    private readonly completions: ICompletionRepository,
    private readonly calendar: ICalendarService,
  ) {}

  async execute(userId: string, taskId: string): Promise<void> {
    const user = await requireUser(this.users, userId)
    const { task } = await requireTask(this.tasks, this.goals, userId, taskId)
    const completion = await this.completions.findByTaskAndDay(task.id, this.calendar.today(user))
    if (!completion) throw new NotFoundError('Completion')
    await this.completions.delete(completion.id)
  }
}
