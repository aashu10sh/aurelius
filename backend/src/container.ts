import { CalendarService } from './application/services/CalendarService'
import { ScoreService } from './application/services/ScoreService'
import { CompleteTaskUseCase } from './application/usecases/completions/CompleteTaskUseCase'
import { UndoCompletionUseCase } from './application/usecases/completions/UndoCompletionUseCase'
import { CreateGoalUseCase } from './application/usecases/goals/CreateGoalUseCase'
import { GetGoalUseCase } from './application/usecases/goals/GetGoalUseCase'
import { ListGoalsUseCase } from './application/usecases/goals/ListGoalsUseCase'
import { SetGoalStatusUseCase } from './application/usecases/goals/SetGoalStatusUseCase'
import { UpdateGoalUseCase } from './application/usecases/goals/UpdateGoalUseCase'
import { ListJournalUseCase } from './application/usecases/journal/ListJournalUseCase'
import { WriteJournalEntryUseCase } from './application/usecases/journal/WriteJournalEntryUseCase'
import { LogMetricUseCase } from './application/usecases/metrics/LogMetricUseCase'
import { SetMetricUseCase } from './application/usecases/metrics/SetMetricUseCase'
import { AddMilestoneUseCase } from './application/usecases/milestones/AddMilestoneUseCase'
import { RemoveMilestoneUseCase } from './application/usecases/milestones/RemoveMilestoneUseCase'
import { UpdateMilestoneUseCase } from './application/usecases/milestones/UpdateMilestoneUseCase'
import { GetProgressUseCase } from './application/usecases/progress/GetProgressUseCase'
import { GetWeekUseCase } from './application/usecases/reflections/GetWeekUseCase'
import { SubmitReflectionUseCase } from './application/usecases/reflections/SubmitReflectionUseCase'
import { CancelRestDayUseCase } from './application/usecases/restDays/CancelRestDayUseCase'
import { ListRestDaysUseCase } from './application/usecases/restDays/ListRestDaysUseCase'
import { PlanRestDayUseCase } from './application/usecases/restDays/PlanRestDayUseCase'
import { AddTaskUseCase } from './application/usecases/tasks/AddTaskUseCase'
import { UpdateTaskUseCase } from './application/usecases/tasks/UpdateTaskUseCase'
import { GetTodayUseCase } from './application/usecases/today/GetTodayUseCase'
import { GetMeUseCase } from './application/usecases/user/GetMeUseCase'
import { UpdatePreferencesUseCase } from './application/usecases/user/UpdatePreferencesUseCase'
import type { Env } from './env'
import { BetterAuthSessionService } from './infrastructure/auth/BetterAuthSessionService'
import { createAuth } from './infrastructure/auth/betterAuth'
import { createDb } from './infrastructure/db/client'
import { D1CompletionRepository } from './infrastructure/repositories/D1CompletionRepository'
import { D1GoalRepository } from './infrastructure/repositories/D1GoalRepository'
import { D1JournalRepository } from './infrastructure/repositories/D1JournalRepository'
import { D1MetricRepository } from './infrastructure/repositories/D1MetricRepository'
import { D1MilestoneRepository } from './infrastructure/repositories/D1MilestoneRepository'
import { D1ReflectionRepository } from './infrastructure/repositories/D1ReflectionRepository'
import { D1RestDayRepository } from './infrastructure/repositories/D1RestDayRepository'
import { D1TaskRepository } from './infrastructure/repositories/D1TaskRepository'
import { D1UserRepository } from './infrastructure/repositories/D1UserRepository'
import { SystemClock, UuidGenerator } from './infrastructure/system'
import type { AppContainer } from './presentation/http/container'

// Composition root: the only place that knows concrete implementations.
// Everything is cheap to construct, so it is built per request.
export const makeContainer = (env: Env): AppContainer => {
  const db = createDb(env.DB)
  const auth = createAuth(db, {
    secret: env.BETTER_AUTH_SECRET,
    google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET },
  })
  const clock = new SystemClock()
  const ids = new UuidGenerator()

  const users = new D1UserRepository(db)
  const goals = new D1GoalRepository(db)
  const tasks = new D1TaskRepository(db)
  const completions = new D1CompletionRepository(db)
  const milestones = new D1MilestoneRepository(db)
  const metrics = new D1MetricRepository(db)
  const restDays = new D1RestDayRepository(db)
  const journal = new D1JournalRepository(db)
  const reflections = new D1ReflectionRepository(db)

  const calendar = new CalendarService(clock)
  const score = new ScoreService(goals, tasks, completions, milestones, reflections, restDays, calendar)

  return {
    session: new BetterAuthSessionService(auth),
    handleAuth: (request) => auth.handler(request),
    useCases: {
      getMe: new GetMeUseCase(users),
      updatePreferences: new UpdatePreferencesUseCase(users),
      getToday: new GetTodayUseCase(users, goals, tasks, completions, milestones, metrics, journal, score, calendar),
      getProgress: new GetProgressUseCase(users, goals, completions, score, calendar),
      listGoals: new ListGoalsUseCase(users, goals, milestones, metrics, score, calendar),
      getGoal: new GetGoalUseCase(users, goals, tasks, milestones, metrics, reflections, score, calendar),
      createGoal: new CreateGoalUseCase(goals, tasks, milestones, metrics, ids, clock),
      updateGoal: new UpdateGoalUseCase(goals),
      setGoalStatus: new SetGoalStatusUseCase(goals, clock),
      addTask: new AddTaskUseCase(goals, tasks, ids, clock),
      updateTask: new UpdateTaskUseCase(goals, tasks),
      completeTask: new CompleteTaskUseCase(users, goals, tasks, completions, calendar, ids, clock),
      undoCompletion: new UndoCompletionUseCase(users, goals, tasks, completions, calendar),
      addMilestone: new AddMilestoneUseCase(goals, milestones, ids),
      updateMilestone: new UpdateMilestoneUseCase(goals, milestones, clock),
      removeMilestone: new RemoveMilestoneUseCase(goals, milestones),
      setMetric: new SetMetricUseCase(goals, metrics),
      logMetric: new LogMetricUseCase(users, goals, metrics, calendar, ids),
      listRestDays: new ListRestDaysUseCase(users, restDays, calendar),
      planRestDay: new PlanRestDayUseCase(users, restDays, calendar),
      cancelRestDay: new CancelRestDayUseCase(users, restDays, calendar),
      writeJournalEntry: new WriteJournalEntryUseCase(users, journal, calendar),
      listJournal: new ListJournalUseCase(journal, reflections),
      getWeek: new GetWeekUseCase(users, goals, completions, reflections, score, calendar),
      submitReflection: new SubmitReflectionUseCase(users, goals, reflections, calendar),
    },
  }
}
