import type { ISessionService } from '../src/application/ports/ISessionService'
import { CalendarService } from '../src/application/services/CalendarService'
import { NotificationService } from '../src/application/services/NotificationService'
import { ScoreService } from '../src/application/services/ScoreService'
import { CompleteTaskUseCase } from '../src/application/usecases/completions/CompleteTaskUseCase'
import { UndoCompletionUseCase } from '../src/application/usecases/completions/UndoCompletionUseCase'
import { CreateGoalUseCase } from '../src/application/usecases/goals/CreateGoalUseCase'
import { GetGoalUseCase } from '../src/application/usecases/goals/GetGoalUseCase'
import { ListGoalsUseCase } from '../src/application/usecases/goals/ListGoalsUseCase'
import { SetGoalStatusUseCase } from '../src/application/usecases/goals/SetGoalStatusUseCase'
import { UpdateGoalUseCase } from '../src/application/usecases/goals/UpdateGoalUseCase'
import { ListJournalUseCase } from '../src/application/usecases/journal/ListJournalUseCase'
import { WriteJournalEntryUseCase } from '../src/application/usecases/journal/WriteJournalEntryUseCase'
import { SendTestNotificationUseCase } from '../src/application/usecases/notifications/SendTestNotificationUseCase'
import { SubscribePushUseCase } from '../src/application/usecases/notifications/SubscribePushUseCase'
import { UnsubscribePushUseCase } from '../src/application/usecases/notifications/UnsubscribePushUseCase'
import { LogMetricUseCase } from '../src/application/usecases/metrics/LogMetricUseCase'
import { SetMetricUseCase } from '../src/application/usecases/metrics/SetMetricUseCase'
import { AddMilestoneUseCase } from '../src/application/usecases/milestones/AddMilestoneUseCase'
import { RemoveMilestoneUseCase } from '../src/application/usecases/milestones/RemoveMilestoneUseCase'
import { UpdateMilestoneUseCase } from '../src/application/usecases/milestones/UpdateMilestoneUseCase'
import { GetProgressUseCase } from '../src/application/usecases/progress/GetProgressUseCase'
import { GetWeekUseCase } from '../src/application/usecases/reflections/GetWeekUseCase'
import { SubmitReflectionUseCase } from '../src/application/usecases/reflections/SubmitReflectionUseCase'
import { CancelRestDayUseCase } from '../src/application/usecases/restDays/CancelRestDayUseCase'
import { ListRestDaysUseCase } from '../src/application/usecases/restDays/ListRestDaysUseCase'
import { PlanRestDayUseCase } from '../src/application/usecases/restDays/PlanRestDayUseCase'
import { AddTaskUseCase } from '../src/application/usecases/tasks/AddTaskUseCase'
import { UpdateTaskUseCase } from '../src/application/usecases/tasks/UpdateTaskUseCase'
import { GetTodayUseCase } from '../src/application/usecases/today/GetTodayUseCase'
import { GetMeUseCase } from '../src/application/usecases/user/GetMeUseCase'
import { UpdatePreferencesUseCase } from '../src/application/usecases/user/UpdatePreferencesUseCase'
import type { User } from '../src/domain/models/user'
import type { AppContainer } from '../src/presentation/http/container'
import {
  FakePushSender,
  FixedClock,
  InMemoryCompletionRepository,
  InMemoryGoalRepository,
  InMemoryJournalRepository,
  InMemoryMetricRepository,
  InMemoryMilestoneRepository,
  InMemoryPushSubscriptionRepository,
  InMemoryReflectionRepository,
  InMemoryRestDayRepository,
  InMemoryTaskRepository,
  InMemoryUserRepository,
  SequentialIds,
} from './fakes'

// Treats `Authorization: Bearer <userId>` as signed in.
class HeaderSessionService implements ISessionService {
  async currentUserId(headers: Headers) {
    return headers.get('authorization')?.replace('Bearer ', '') ?? null
  }
}

// The same wiring as src/container.ts, over in-memory fakes.
export const makeFakeContainer = (users: User[], now: Date): AppContainer => {
  const clock = new FixedClock(now)
  const ids = new SequentialIds()
  const userRepo = new InMemoryUserRepository(users)
  const goals = new InMemoryGoalRepository()
  const tasks = new InMemoryTaskRepository()
  const completions = new InMemoryCompletionRepository()
  const milestones = new InMemoryMilestoneRepository(goals)
  const metrics = new InMemoryMetricRepository()
  const restDays = new InMemoryRestDayRepository()
  const journal = new InMemoryJournalRepository()
  const reflections = new InMemoryReflectionRepository()
  const calendar = new CalendarService(clock)
  const score = new ScoreService(goals, tasks, completions, milestones, reflections, restDays, calendar)
  const pushSubscriptions = new InMemoryPushSubscriptionRepository()
  const notifications = new NotificationService(pushSubscriptions, new FakePushSender())

  return {
    session: new HeaderSessionService(),
    handleAuth: async () => new Response('auth', { status: 200 }),
    pushPublicKey: () => 'test-public-key',
    useCases: {
      getMe: new GetMeUseCase(userRepo),
      updatePreferences: new UpdatePreferencesUseCase(userRepo),
      getToday: new GetTodayUseCase(userRepo, goals, tasks, completions, milestones, metrics, journal, score, calendar),
      getProgress: new GetProgressUseCase(userRepo, goals, completions, score, calendar),
      listGoals: new ListGoalsUseCase(userRepo, goals, milestones, metrics, score, calendar),
      getGoal: new GetGoalUseCase(userRepo, goals, tasks, milestones, metrics, reflections, score, calendar),
      createGoal: new CreateGoalUseCase(goals, tasks, milestones, metrics, ids, clock),
      updateGoal: new UpdateGoalUseCase(goals),
      setGoalStatus: new SetGoalStatusUseCase(goals, clock),
      addTask: new AddTaskUseCase(goals, tasks, ids, clock),
      updateTask: new UpdateTaskUseCase(goals, tasks),
      completeTask: new CompleteTaskUseCase(userRepo, goals, tasks, completions, calendar, ids, clock, score),
      undoCompletion: new UndoCompletionUseCase(userRepo, goals, tasks, completions, calendar),
      addMilestone: new AddMilestoneUseCase(goals, milestones, ids),
      updateMilestone: new UpdateMilestoneUseCase(goals, milestones, clock),
      removeMilestone: new RemoveMilestoneUseCase(goals, milestones),
      setMetric: new SetMetricUseCase(goals, metrics),
      logMetric: new LogMetricUseCase(userRepo, goals, metrics, calendar, ids),
      listRestDays: new ListRestDaysUseCase(userRepo, restDays, calendar),
      planRestDay: new PlanRestDayUseCase(userRepo, restDays, calendar),
      cancelRestDay: new CancelRestDayUseCase(userRepo, restDays, calendar),
      writeJournalEntry: new WriteJournalEntryUseCase(userRepo, journal, calendar),
      listJournal: new ListJournalUseCase(journal, reflections),
      getWeek: new GetWeekUseCase(userRepo, goals, completions, reflections, score, calendar),
      submitReflection: new SubmitReflectionUseCase(userRepo, goals, reflections, calendar),
      subscribePush: new SubscribePushUseCase(userRepo, pushSubscriptions, clock),
      unsubscribePush: new UnsubscribePushUseCase(pushSubscriptions),
      sendTestNotification: new SendTestNotificationUseCase(notifications),
    },
  }
}
