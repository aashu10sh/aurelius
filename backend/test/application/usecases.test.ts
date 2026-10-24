import { beforeEach, describe, expect, test } from 'bun:test'
import { CalendarService } from '../../src/application/services/CalendarService'
import { NotificationService } from '../../src/application/services/NotificationService'
import { ScoreService } from '../../src/application/services/ScoreService'
import { CompleteTaskUseCase } from '../../src/application/usecases/completions/CompleteTaskUseCase'
import { UndoCompletionUseCase } from '../../src/application/usecases/completions/UndoCompletionUseCase'
import { CreateGoalUseCase } from '../../src/application/usecases/goals/CreateGoalUseCase'
import { SetGoalStatusUseCase } from '../../src/application/usecases/goals/SetGoalStatusUseCase'
import { UpdateMilestoneUseCase } from '../../src/application/usecases/milestones/UpdateMilestoneUseCase'
import { ScheduleRemindersUseCase } from '../../src/application/usecases/notifications/ScheduleRemindersUseCase'
import { SendReminderUseCase } from '../../src/application/usecases/notifications/SendReminderUseCase'
import { GetProgressUseCase } from '../../src/application/usecases/progress/GetProgressUseCase'
import { GetWeekUseCase } from '../../src/application/usecases/reflections/GetWeekUseCase'
import { SubmitReflectionUseCase } from '../../src/application/usecases/reflections/SubmitReflectionUseCase'
import { PlanRestDayUseCase } from '../../src/application/usecases/restDays/PlanRestDayUseCase'
import { GetTodayUseCase } from '../../src/application/usecases/today/GetTodayUseCase'
import { ConflictError, InvalidError, NotFoundError } from '../../src/domain/errors'
import {
  FakePushSender,
  FakeReminderQueue,
  FixedClock,
  InMemoryCompletionRepository,
  InMemoryGoalRepository,
  InMemoryJournalRepository,
  InMemoryMetricRepository,
  InMemoryMilestoneRepository,
  InMemoryPushSubscriptionRepository,
  InMemoryReflectionRepository,
  InMemoryReminderLogRepository,
  InMemoryRestDayRepository,
  InMemoryTaskRepository,
  InMemoryUserRepository,
  SequentialIds,
} from '../fakes'

// Thursday 22 Oct 2026, 14:00 UTC.
const NOW = new Date('2026-10-22T14:00:00Z')
const SUNDAY = new Date('2026-10-25T14:00:00Z')
const MONDAY = new Date('2026-10-26T14:00:00Z')

const world = () => {
  const clock = new FixedClock(NOW)
  const ids = new SequentialIds()
  const users = new InMemoryUserRepository([
    {
      id: 'hari',
      name: 'Hari',
      username: 'hari',
      email: 'hari@example.com',
      timezone: 'UTC',
      reminderTime: '20:00',
      dayStartHour: 3,
      createdAt: new Date('2026-10-01T09:00:00Z'),
    },
    {
      id: 'sita',
      name: 'Sita',
      username: 'sita',
      email: 'sita@example.com',
      timezone: 'UTC',
      reminderTime: '20:00',
      dayStartHour: 3,
      createdAt: new Date('2026-10-01T09:00:00Z'),
    },
  ])
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
  const sender = new FakePushSender()
  const queue = new FakeReminderQueue()
  const notifications = new NotificationService(pushSubscriptions, sender)

  return {
    clock,
    pushSubscriptions,
    sender,
    queue,
    goals,
    tasks,
    completions,
    milestones,
    metrics,
    createGoal: new CreateGoalUseCase(goals, tasks, milestones, metrics, ids, clock),
    setGoalStatus: new SetGoalStatusUseCase(goals, clock),
    completeTask: new CompleteTaskUseCase(users, goals, tasks, completions, calendar, ids, clock, score),
    undoCompletion: new UndoCompletionUseCase(users, goals, tasks, completions, calendar),
    updateMilestone: new UpdateMilestoneUseCase(goals, milestones, clock),
    getToday: new GetTodayUseCase(users, goals, tasks, completions, milestones, metrics, journal, score, calendar),
    getProgress: new GetProgressUseCase(users, goals, completions, score, calendar),
    submitReflection: new SubmitReflectionUseCase(users, goals, reflections, calendar),
    getWeek: new GetWeekUseCase(users, goals, completions, reflections, score, calendar),
    planRestDay: new PlanRestDayUseCase(users, restDays, calendar),
    scheduleReminders: new ScheduleRemindersUseCase(users, pushSubscriptions, queue, calendar),
    sendReminder: new SendReminderUseCase(
      users,
      goals,
      tasks,
      completions,
      reflections,
      new InMemoryReminderLogRepository(),
      score,
      notifications,
      calendar,
    ),
  }
}

type World = ReturnType<typeof world>

const seniorGoal = (w: World) =>
  w.createGoal.execute('hari', {
    title: 'Become a Senior Engineer',
    why: 'Lead bigger projects',
    tasks: [
      { title: 'System design', effort: 'heavy', cadence: { type: 'weekly', count: 3 } },
      { title: 'Tech podcast', effort: 'light', cadence: { type: 'weekly', count: 2 } },
    ],
    milestones: ['Lead a design review', 'Ship side project v1'],
  })

let w: World
beforeEach(() => {
  w = world()
})

describe('CreateGoalUseCase', () => {
  test('creates the goal with its tasks, milestones and metric', async () => {
    const goal = await w.createGoal.execute('hari', {
      title: '  Get fit ',
      tasks: [{ title: 'Walk', effort: 'light', cadence: { type: 'daily', count: 5 } }],
      milestones: ['Run 5k'],
      metric: { unit: 'kg', startValue: 82, targetValue: 77 },
    })
    expect(goal.title).toBe('Get fit')
    expect(w.tasks.rows[0]!.cadence).toEqual({ type: 'daily', count: 1 }) // daily is always 1
    expect(w.milestones.rows.map((m) => m.title)).toEqual(['Run 5k'])
    expect(w.metrics.rows[0]!.currentValue).toBe(82)
  })

  test('writes nothing when any part is invalid', async () => {
    const attempt = w.createGoal.execute('hari', {
      title: 'Read more',
      tasks: [{ title: 'Read', effort: 'light', cadence: { type: 'weekly', count: 9 } }],
    })
    await expect(attempt).rejects.toThrow(InvalidError)
    expect(w.goals.rows).toHaveLength(0)
  })
})

describe('CompleteTaskUseCase', () => {
  test('awards XP by effort, once per task per day', async () => {
    await seniorGoal(w)
    const [design] = w.tasks.rows
    const completion = await w.completeTask.execute('hari', design!.id)
    expect(completion).toMatchObject({ day: '2026-10-22', xpAwarded: 30 })
    await expect(w.completeTask.execute('hari', design!.id)).rejects.toThrow(ConflictError)
  })

  test('reports the level a tick crosses into', async () => {
    await seniorGoal(w)
    await w.updateMilestone.execute('hari', w.milestones.rows[0]!.id, { done: true }) // 50 XP
    expect((await w.completeTask.execute('hari', w.tasks.rows[1]!.id)).levelUp).toBeNull() // 60
    expect((await w.completeTask.execute('hari', w.tasks.rows[0]!.id)).levelUp).toBeNull() // 90
    await w.createGoal.execute('hari', {
      title: 'Get fit',
      tasks: [{ title: 'Gym', effort: 'heavy', cadence: { type: 'daily', count: 1 } }],
    })
    expect((await w.completeTask.execute('hari', w.tasks.rows.at(-1)!.id)).levelUp).toBe(1) // 120 ≥ 100
  })

  test("another user's task reads as not found", async () => {
    await seniorGoal(w)
    await expect(w.completeTask.execute('sita', w.tasks.rows[0]!.id)).rejects.toThrow(NotFoundError)
  })

  test('late-night work counts for the evening before', async () => {
    await seniorGoal(w)
    w.clock.current = new Date('2026-10-23T01:30:00Z') // before the 3am roll-over
    const completion = await w.completeTask.execute('hari', w.tasks.rows[0]!.id)
    expect(completion.day).toBe('2026-10-22')
  })

  test('undo removes only today’s tick', async () => {
    await seniorGoal(w)
    const task = w.tasks.rows[0]!
    await w.completeTask.execute('hari', task.id)
    await w.undoCompletion.execute('hari', task.id)
    expect(w.completions.rows).toHaveLength(0)
    await expect(w.undoCompletion.execute('hari', task.id)).rejects.toThrow(NotFoundError)
  })
})

describe('GetTodayUseCase', () => {
  test('shows XP today, cadence progress and the forgiving streak', async () => {
    await seniorGoal(w)
    const [design, podcast] = w.tasks.rows
    // Earlier this week: design on Monday and Tuesday, a miss on Wednesday.
    w.completions.rows.push(
      { id: 'c1', taskId: design!.id, userId: 'hari', day: '2026-10-19', xpAwarded: 30, createdAt: NOW },
      { id: 'c2', taskId: design!.id, userId: 'hari', day: '2026-10-20', xpAwarded: 30, createdAt: NOW },
    )
    await w.completeTask.execute('hari', podcast!.id)

    const today = await w.getToday.execute('hari')
    expect(today.day).toBe('2026-10-22')
    expect(today.xpToday).toBe(10)
    expect(today.streak.current).toBe(3) // Mon, Tue, today; Wednesday was a grace day
    const tasks = today.goals[0]!.tasks
    expect(tasks.find((t) => t.id === design!.id)).toMatchObject({ periodDone: 2, periodTarget: 3, doneToday: false })
    expect(tasks.find((t) => t.id === podcast!.id)).toMatchObject({ periodDone: 1, doneToday: true })
  })
})

describe('XP and progress', () => {
  test('total XP adds completions, milestones, completed goals and reflections', async () => {
    const goal = await seniorGoal(w)
    await w.completeTask.execute('hari', w.tasks.rows[0]!.id) // 30
    await w.updateMilestone.execute('hari', w.milestones.rows[0]!.id, { done: true }) // 50
    w.clock.current = SUNDAY
    await w.submitReflection.execute('hari', { answers: {}, goalRatings: { [goal.id]: { rating: 4 } } }) // 20
    await w.setGoalStatus.execute('hari', goal.id, 'completed') // 200

    const progress = await w.getProgress.execute('hari')
    expect(progress.level.xp).toBe(300)
    expect(progress.level.level).toBe(2)
    expect(progress.heatmap.find((d) => d.day === '2026-10-22')).toMatchObject({ xp: 30, status: 'active' })
  })
})

describe('SubmitReflectionUseCase', () => {
  test('only opens on Sunday, and on Monday for the week just ended', async () => {
    const goal = await seniorGoal(w)
    const input = { answers: {}, goalRatings: { [goal.id]: { rating: 4 } } }
    await expect(w.submitReflection.execute('hari', input)).rejects.toThrow('open on Sunday')

    w.clock.current = SUNDAY
    expect((await w.submitReflection.execute('hari', input)).reflection.weekStart).toBe('2026-10-19')
    expect((await w.getWeek.execute('hari')).canReflect).toBe(true)

    w.clock.current = MONDAY
    const late = await w.submitReflection.execute('hari', input)
    expect(late).toMatchObject({ firstThisWeek: false, reflection: { weekStart: '2026-10-19' } })
    expect(await w.getWeek.execute('hari')).toMatchObject({ weekStart: '2026-10-19', today: '2026-10-26' })
  })

  test('is closed mid-week, showing the current week', async () => {
    await seniorGoal(w)
    expect(await w.getWeek.execute('hari')).toMatchObject({
      weekStart: '2026-10-19',
      canReflect: false,
      opensOn: '2026-10-25',
    })
  })

  test('only the first save of the week is new', async () => {
    const goal = await seniorGoal(w)
    w.clock.current = SUNDAY
    const input = { answers: { forward: 'Shipped login' }, goalRatings: { [goal.id]: { rating: 4 } } }
    expect((await w.submitReflection.execute('hari', input)).firstThisWeek).toBe(true)
    expect((await w.submitReflection.execute('hari', input)).firstThisWeek).toBe(false)
  })

  test("can't rate someone else's goal", async () => {
    const goal = await seniorGoal(w)
    w.clock.current = SUNDAY
    const attempt = w.submitReflection.execute('sita', { answers: {}, goalRatings: { [goal.id]: { rating: 3 } } })
    await expect(attempt).rejects.toThrow(InvalidError)
  })
})

describe('PlanRestDayUseCase', () => {
  test('plans ahead, one per week', async () => {
    await w.planRestDay.execute('hari', '2026-10-25')
    await expect(w.planRestDay.execute('hari', '2026-10-24')).rejects.toThrow('per week')
    await expect(w.planRestDay.execute('hari', '2026-10-21')).rejects.toThrow('in advance')
  })
})

describe('Reminders', () => {
  const subscribe = (w: World, userId: string, endpoint: string) =>
    w.pushSubscriptions.save({ userId, endpoint, keys: { p256dh: 'p', auth: 'a' }, createdAt: NOW })

  test('the scheduler queues subscribed users whose reminder time is in this window', async () => {
    await subscribe(w, 'hari', 'https://push.example/hari') // reminder 20:00 UTC
    await subscribe(w, 'sita', 'https://push.example/sita')
    expect(await w.scheduleReminders.execute(new Date('2026-10-22T19:55:00Z'))).toBe(0)
    expect(await w.scheduleReminders.execute(new Date('2026-10-22T20:00:00Z'))).toBe(2)
    expect(w.queue.jobs).toContainEqual({ userId: 'hari', day: '2026-10-22' })
  })

  test('sends one dynamic reminder a day, and none once something is ticked', async () => {
    await seniorGoal(w)
    await subscribe(w, 'hari', 'https://push.example/hari')
    const job = { userId: 'hari', day: '2026-10-22' }

    expect(await w.sendReminder.execute(job)).toBe('sent')
    expect(w.sender.sent[0]!.notification.body).toContain('“Tech podcast”')
    expect(await w.sendReminder.execute(job)).toBe('skipped') // redelivered message

    const other = world()
    await seniorGoal(other)
    await other.pushSubscriptions.save({ userId: 'hari', endpoint: 'e', keys: { p256dh: 'p', auth: 'a' }, createdAt: NOW })
    await other.completeTask.execute('hari', other.tasks.rows[1]!.id)
    expect(await other.sendReminder.execute(job)).toBe('skipped')
  })

  test('prunes gone subscriptions and retries when every device failed', async () => {
    await seniorGoal(w)
    await subscribe(w, 'hari', 'https://push.example/old')
    await subscribe(w, 'hari', 'https://push.example/flaky')
    w.sender.results.set('https://push.example/old', 'gone')
    w.sender.results.set('https://push.example/flaky', 'failed')
    const job = { userId: 'hari', day: '2026-10-22' }

    expect(await w.sendReminder.execute(job)).toBe('retry')
    expect(w.pushSubscriptions.rows.map((s) => s.endpoint)).toEqual(['https://push.example/flaky'])

    w.sender.results.clear()
    expect(await w.sendReminder.execute(job)).toBe('sent')
  })

  test('a message for a day that has passed is dropped', async () => {
    await seniorGoal(w)
    await subscribe(w, 'hari', 'https://push.example/hari')
    expect(await w.sendReminder.execute({ userId: 'hari', day: '2026-10-21' })).toBe('skipped')
  })
})
