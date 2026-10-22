import { beforeEach, describe, expect, test } from 'bun:test'
import { CalendarService } from '../../src/application/services/CalendarService'
import { ScoreService } from '../../src/application/services/ScoreService'
import { CompleteTaskUseCase } from '../../src/application/usecases/completions/CompleteTaskUseCase'
import { UndoCompletionUseCase } from '../../src/application/usecases/completions/UndoCompletionUseCase'
import { CreateGoalUseCase } from '../../src/application/usecases/goals/CreateGoalUseCase'
import { SetGoalStatusUseCase } from '../../src/application/usecases/goals/SetGoalStatusUseCase'
import { UpdateMilestoneUseCase } from '../../src/application/usecases/milestones/UpdateMilestoneUseCase'
import { GetProgressUseCase } from '../../src/application/usecases/progress/GetProgressUseCase'
import { SubmitReflectionUseCase } from '../../src/application/usecases/reflections/SubmitReflectionUseCase'
import { PlanRestDayUseCase } from '../../src/application/usecases/restDays/PlanRestDayUseCase'
import { GetTodayUseCase } from '../../src/application/usecases/today/GetTodayUseCase'
import { ConflictError, InvalidError, NotFoundError } from '../../src/domain/errors'
import {
  FixedClock,
  InMemoryCompletionRepository,
  InMemoryGoalRepository,
  InMemoryJournalRepository,
  InMemoryMetricRepository,
  InMemoryMilestoneRepository,
  InMemoryReflectionRepository,
  InMemoryRestDayRepository,
  InMemoryTaskRepository,
  InMemoryUserRepository,
  SequentialIds,
} from '../fakes'

// Thursday 22 Oct 2026, 14:00 UTC.
const NOW = new Date('2026-10-22T14:00:00Z')

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

  return {
    clock,
    goals,
    tasks,
    completions,
    milestones,
    metrics,
    createGoal: new CreateGoalUseCase(goals, tasks, milestones, metrics, ids, clock),
    setGoalStatus: new SetGoalStatusUseCase(goals, clock),
    completeTask: new CompleteTaskUseCase(users, goals, tasks, completions, calendar, ids, clock),
    undoCompletion: new UndoCompletionUseCase(users, goals, tasks, completions, calendar),
    updateMilestone: new UpdateMilestoneUseCase(goals, milestones, clock),
    getToday: new GetTodayUseCase(users, goals, tasks, completions, milestones, metrics, journal, score, calendar),
    getProgress: new GetProgressUseCase(users, goals, completions, score, calendar),
    submitReflection: new SubmitReflectionUseCase(users, goals, reflections, calendar),
    planRestDay: new PlanRestDayUseCase(users, restDays, calendar),
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
    await w.submitReflection.execute('hari', { answers: {}, goalRatings: { [goal.id]: { rating: 4 } } }) // 20
    await w.setGoalStatus.execute('hari', goal.id, 'completed') // 200

    const progress = await w.getProgress.execute('hari')
    expect(progress.level.xp).toBe(300)
    expect(progress.level.level).toBe(2)
    expect(progress.heatmap.at(-1)).toMatchObject({ day: '2026-10-22', xp: 30, status: 'active' })
  })
})

describe('SubmitReflectionUseCase', () => {
  test('only the first save of the week is new', async () => {
    const goal = await seniorGoal(w)
    const input = { answers: { forward: 'Shipped login' }, goalRatings: { [goal.id]: { rating: 4 } } }
    expect((await w.submitReflection.execute('hari', input)).firstThisWeek).toBe(true)
    expect((await w.submitReflection.execute('hari', input)).firstThisWeek).toBe(false)
  })

  test("can't rate someone else's goal", async () => {
    const goal = await seniorGoal(w)
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
