import { AnalyticsService } from './application/services/AnalyticsService'
import { CalendarService } from './application/services/CalendarService'
import { NotificationService } from './application/services/NotificationService'
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
import { ScheduleRemindersUseCase } from './application/usecases/notifications/ScheduleRemindersUseCase'
import { SendReminderUseCase } from './application/usecases/notifications/SendReminderUseCase'
import { SendTestNotificationUseCase } from './application/usecases/notifications/SendTestNotificationUseCase'
import { SubscribePushUseCase } from './application/usecases/notifications/SubscribePushUseCase'
import { UnsubscribePushUseCase } from './application/usecases/notifications/UnsubscribePushUseCase'
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
import { MixpanelSink, NoopSink } from './infrastructure/analytics/MixpanelSink'
import { createAuth } from './infrastructure/auth/betterAuth'
import { createDb } from './infrastructure/db/client'
import { vapidPublicKey, WebPushSender } from './infrastructure/push/WebPushSender'
import { CloudflareReminderQueue } from './infrastructure/queue/CloudflareReminderQueue'
import { D1CompletionRepository } from './infrastructure/repositories/D1CompletionRepository'
import { D1GoalRepository } from './infrastructure/repositories/D1GoalRepository'
import { D1JournalRepository } from './infrastructure/repositories/D1JournalRepository'
import { D1MetricRepository } from './infrastructure/repositories/D1MetricRepository'
import { D1MilestoneRepository } from './infrastructure/repositories/D1MilestoneRepository'
import { D1PushSubscriptionRepository } from './infrastructure/repositories/D1PushSubscriptionRepository'
import { D1ReflectionRepository } from './infrastructure/repositories/D1ReflectionRepository'
import { D1ReminderLogRepository } from './infrastructure/repositories/D1ReminderLogRepository'
import { D1RestDayRepository } from './infrastructure/repositories/D1RestDayRepository'
import { D1TaskRepository } from './infrastructure/repositories/D1TaskRepository'
import { D1UserRepository } from './infrastructure/repositories/D1UserRepository'
import { SystemClock, UuidGenerator } from './infrastructure/system'
import type { AppContainer } from './presentation/http/container'

// Composition root: the only place that knows concrete implementations.
// Everything is cheap to construct, so it is built per request (or per
// cron tick / queue batch).

// The Mixpanel project lives in the EU data region.
const MIXPANEL_API_HOST = 'https://api-eu.mixpanel.com'

// Repositories and services shared by the HTTP API and the background jobs.
const makeCore = (env: Env) => {
  const db = createDb(env.DB)
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

  const pushSubscriptions = new D1PushSubscriptionRepository(db)
  const notifications = new NotificationService(pushSubscriptions, new WebPushSender(env.VAPID_PRIVATE_KEY, env.VAPID_SUBJECT))

  // One buffer per request or job; flushed by the caller (middleware, index.ts).
  const analytics = new AnalyticsService(
    env.MIXPANEL_TOKEN ? new MixpanelSink(env.MIXPANEL_TOKEN, MIXPANEL_API_HOST) : new NoopSink(),
    users,
    clock,
    ids,
  )

  return {
    db,
    clock,
    ids,
    users,
    goals,
    tasks,
    completions,
    milestones,
    metrics,
    restDays,
    journal,
    reflections,
    calendar,
    score,
    pushSubscriptions,
    notifications,
    analytics,
  }
}

export const makeContainer = (env: Env): AppContainer => {
  const {
    db,
    clock,
    ids,
    users,
    goals,
    tasks,
    completions,
    milestones,
    metrics,
    restDays,
    journal,
    reflections,
    calendar,
    score,
    pushSubscriptions,
    notifications,
    analytics,
  } = makeCore(env)
  const auth = createAuth(db, {
    secret: env.BETTER_AUTH_SECRET,
    google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET },
    analytics,
  })

  return {
    session: new BetterAuthSessionService(auth),
    handleAuth: (request) => auth.handler(request),
    // Lazy, so a missing or bad key only breaks push, not the whole API.
    pushPublicKey: () => vapidPublicKey(env.VAPID_PRIVATE_KEY),
    analytics,
    // The browser SDK's token: public by design (it can only send events).
    analyticsToken: env.MIXPANEL_TOKEN || null,
    useCases: {
      getMe: new GetMeUseCase(users),
      updatePreferences: new UpdatePreferencesUseCase(users, analytics),
      getToday: new GetTodayUseCase(users, goals, tasks, completions, milestones, metrics, journal, score, calendar),
      getProgress: new GetProgressUseCase(users, goals, completions, score, calendar),
      listGoals: new ListGoalsUseCase(users, goals, milestones, metrics, score, calendar),
      getGoal: new GetGoalUseCase(users, goals, tasks, milestones, metrics, reflections, score, calendar),
      createGoal: new CreateGoalUseCase(goals, tasks, milestones, metrics, ids, clock, analytics),
      updateGoal: new UpdateGoalUseCase(goals),
      setGoalStatus: new SetGoalStatusUseCase(goals, clock, analytics),
      addTask: new AddTaskUseCase(goals, tasks, ids, clock, analytics),
      updateTask: new UpdateTaskUseCase(goals, tasks),
      completeTask: new CompleteTaskUseCase(users, goals, tasks, completions, calendar, ids, clock, score, analytics),
      undoCompletion: new UndoCompletionUseCase(users, goals, tasks, completions, calendar, analytics),
      addMilestone: new AddMilestoneUseCase(goals, milestones, ids),
      updateMilestone: new UpdateMilestoneUseCase(goals, milestones, clock, analytics),
      removeMilestone: new RemoveMilestoneUseCase(goals, milestones),
      setMetric: new SetMetricUseCase(goals, metrics),
      logMetric: new LogMetricUseCase(users, goals, metrics, calendar, ids),
      listRestDays: new ListRestDaysUseCase(users, restDays, calendar),
      planRestDay: new PlanRestDayUseCase(users, restDays, calendar, analytics),
      cancelRestDay: new CancelRestDayUseCase(users, restDays, calendar),
      writeJournalEntry: new WriteJournalEntryUseCase(users, journal, calendar, analytics),
      listJournal: new ListJournalUseCase(journal, reflections),
      getWeek: new GetWeekUseCase(users, goals, completions, reflections, score, calendar),
      submitReflection: new SubmitReflectionUseCase(users, goals, reflections, calendar, analytics),
      subscribePush: new SubscribePushUseCase(users, pushSubscriptions, clock, analytics),
      unsubscribePush: new UnsubscribePushUseCase(pushSubscriptions, analytics),
      sendTestNotification: new SendTestNotificationUseCase(notifications),
    },
  }
}

// Cron and queue handlers (src/index.ts).
export const makeJobs = (env: Env) => {
  const { db, users, goals, tasks, completions, reflections, calendar, score, pushSubscriptions, notifications, analytics } =
    makeCore(env)
  return {
    analytics,
    scheduleReminders: new ScheduleRemindersUseCase(users, pushSubscriptions, new CloudflareReminderQueue(env.REMINDERS), calendar),
    sendReminder: new SendReminderUseCase(
      users,
      goals,
      tasks,
      completions,
      reflections,
      new D1ReminderLogRepository(db),
      score,
      notifications,
      calendar,
      analytics,
    ),
  }
}
