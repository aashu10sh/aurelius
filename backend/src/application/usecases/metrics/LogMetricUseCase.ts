import { NotFoundError } from '../../../domain/errors'
import type { IGoalRepository } from '../../../domain/repositories/IGoalRepository'
import type { IMetricRepository } from '../../../domain/repositories/IMetricRepository'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository'
import type { IIdGenerator } from '../../ports/IIdGenerator'
import type { ICalendarService } from '../../services/CalendarService'
import { requireGoal, requireUser } from '../shared'
import { type MetricView, toMetricView } from '../views'

// Records a new reading (e.g. today's weight) and moves the metric to it.
export class LogMetricUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly goals: IGoalRepository,
    private readonly metrics: IMetricRepository,
    private readonly calendar: ICalendarService,
    private readonly ids: IIdGenerator,
  ) {}

  async execute(userId: string, goalId: string, value: number): Promise<MetricView> {
    const [user, goal, [metric]] = await Promise.all([
      requireUser(this.users, userId),
      requireGoal(this.goals, userId, goalId),
      this.metrics.findByGoalIds([goalId]),
    ])
    if (!metric) throw new NotFoundError('Metric')

    const next = { ...metric, currentValue: value }
    await Promise.all([
      this.metrics.save(next),
      this.metrics.addLog({ id: this.ids.next(), goalId: goal.id, value, loggedOn: this.calendar.today(user) }),
    ])
    return toMetricView(next)!
  }
}
