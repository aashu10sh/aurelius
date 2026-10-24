import { describe, expect, test } from 'bun:test'
import { addDays, dayAt, daysBetween, isDay, minutesAt, weekStart } from '../../src/domain/models/day'
import type { Task } from '../../src/domain/models/task'
import { plannedCount } from '../../src/domain/rules/cadence'
import { goalConsistency, overallConsistency } from '../../src/domain/rules/consistency'
import { reflectionOpensOn, reflectionWeek } from '../../src/domain/rules/reflection'
import { composeReminder, isReminderDue } from '../../src/domain/rules/reminder'
import { assertCanPlanRestDay } from '../../src/domain/rules/restDay'
import { computeStreak } from '../../src/domain/rules/streak'
import { levelFor, totalXp } from '../../src/domain/rules/xp'

const task = (id: string, effort: Task['effort'], type: Task['cadence']['type'], count = 1): Task => ({
  id,
  goalId: 'g1',
  title: id,
  effort,
  cadence: { type, count },
  archived: false,
  createdAt: new Date(0),
})

describe('day', () => {
  test('weeks start on Monday', () => {
    expect(weekStart('2026-10-22')).toBe('2026-10-19') // Thursday → Monday
    expect(weekStart('2026-10-19')).toBe('2026-10-19')
    expect(weekStart('2026-10-25')).toBe('2026-10-19') // Sunday
  })

  test('day arithmetic crosses months', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(daysBetween('2026-10-01', '2026-10-28')).toBe(27)
    expect(isDay('2026-02-30')).toBe(false)
  })

  test('the day rolls over at the user day start hour', () => {
    // 01:30 local in Kathmandu (UTC+5:45) still counts as the previous day.
    const lateNight = new Date('2026-10-21T19:45:00Z')
    expect(dayAt(lateNight, 'Asia/Kathmandu', 3)).toBe('2026-10-21')
    expect(dayAt(lateNight, 'Asia/Kathmandu', 0)).toBe('2026-10-22')
  })
})

describe('xp and levels', () => {
  test('level thresholds follow 50 × L × (L + 1)', () => {
    expect(levelFor(99).level).toBe(0)
    expect(levelFor(100).level).toBe(1)
    expect(levelFor(5_500).level).toBe(10)
    expect(levelFor(3_120)).toEqual({ level: 7, xp: 3_120, levelStartXp: 2_800, nextLevelXp: 3_600 })
  })

  test('total xp is derived from stored facts', () => {
    expect(totalXp({ completionXp: 1_000, milestonesDone: 2, goalsCompleted: 1, reflections: 3 })).toBe(1_360)
  })
})

describe('consistency', () => {
  test('planned counts over 28 days', () => {
    expect(plannedCount({ type: 'daily', count: 1 }, 28, 4)).toBe(24)
    expect(plannedCount({ type: 'weekly', count: 3 }, 28, 0)).toBe(12)
    expect(plannedCount({ type: 'monthly', count: 2 }, 28, 0)).toBe(2)
  })

  test("Hari's week from the spec: 220 of 250 planned = 88%", () => {
    const tasks = [
      task('sd', 'heavy', 'weekly', 3),
      task('lc', 'medium', 'weekly', 4),
      task('pod', 'light', 'weekly', 2),
      task('sp', 'heavy', 'weekly', 2),
    ]
    const done: [string, string][] = [
      ['sd', '2026-10-19'], ['lc', '2026-10-19'],
      ['pod', '2026-10-20'],
      ['sd', '2026-10-22'], ['lc', '2026-10-22'], ['sp', '2026-10-22'],
      ['lc', '2026-10-23'],
      ['sd', '2026-10-24'], ['sp', '2026-10-24'],
    ]
    const xp = { sd: 30, lc: 20, pod: 10, sp: 30 } as Record<string, number>
    const result = goalConsistency({
      today: '2026-10-25',
      goalStart: '2026-10-19', // a 7-day-old goal: the window is 7 days, not 28
      tasks,
      completions: done.map(([taskId, day]) => ({ taskId, day, xpAwarded: xp[taskId]! })),
      restDays: ['2026-10-25'],
    })
    expect(result.earnedXp).toBe(220)
    expect(result.plannedXp).toBe(250)
    expect(result.score).toBeCloseTo(0.88)
  })

  test('extra work caps at 100% and archived tasks plan nothing', () => {
    const result = goalConsistency({
      today: '2026-10-22',
      goalStart: '2026-10-22',
      tasks: [task('walk', 'light', 'daily'), { ...task('old', 'heavy', 'daily'), archived: true }],
      completions: [
        { taskId: 'walk', day: '2026-10-22', xpAwarded: 10 },
        { taskId: 'old', day: '2026-10-22', xpAwarded: 30 },
      ],
      restDays: [],
    })
    expect(result.plannedXp).toBe(10)
    expect(result.score).toBe(1)
  })

  test('overall sums goals; nothing planned gives null', () => {
    expect(overallConsistency([]).score).toBeNull()
    const overall = overallConsistency([
      { earnedXp: 50, plannedXp: 100, score: 0.5 },
      { earnedXp: 100, plannedXp: 100, score: 1 },
    ])
    expect(overall.score).toBe(0.75)
  })
})

describe('forgiving streaks', () => {
  const streak = (pattern: string, restAt: number[] = []) => {
    // One char per day ending today: A active, . miss, R rest.
    const since = '2026-10-01'
    const today = addDays(since, pattern.length - 1)
    const active = new Set<string>()
    const rest = new Set<string>()
    ;[...pattern].forEach((c, i) => {
      if (c === 'A') active.add(addDays(since, i))
      if (c === 'R' || restAt.includes(i)) rest.add(addDays(since, i))
    })
    return computeStreak({ since, today, activeDays: active, restDays: rest })
  }

  test('a single miss is forgiven', () => {
    const s = streak('AA.AA')
    expect(s.current).toBe(4)
    expect(s.statuses.get('2026-10-03')).toBe('grace')
  })

  test('two misses in a row break it', () => {
    const s = streak('AAA..AA')
    expect(s.current).toBe(2)
    expect(s.longest).toBe(3)
    expect(s.statuses.get('2026-10-04')).toBe('missed')
    expect(s.statuses.get('2026-10-05')).toBe('missed')
  })

  test('rest days keep the streak without adding to it', () => {
    expect(streak('AAR.A').current).toBe(3)
  })

  test('today with nothing done is still open', () => {
    const s = streak('AAA.')
    expect(s.current).toBe(3)
    expect(s.statuses.get('2026-10-04')).toBe('pending')
  })

  test('yesterday missed and today still open keeps the streak alive', () => {
    expect(streak('AAA..').current).toBe(3)
  })
})

describe('rest days', () => {
  test('must be planned in advance, one per week', () => {
    expect(() => assertCanPlanRestDay('2026-10-22', '2026-10-22', [])).toThrow('in advance')
    expect(() => assertCanPlanRestDay('2026-10-25', '2026-10-22', ['2026-10-24'])).toThrow('per week')
    expect(() => assertCanPlanRestDay('2026-10-26', '2026-10-22', ['2026-10-24'])).not.toThrow()
  })
})

describe('reflection window', () => {
  test('opens Sunday and stays open Monday for the week just ended', () => {
    expect(reflectionWeek('2026-10-25')).toBe('2026-10-19') // Sunday
    expect(reflectionWeek('2026-10-26')).toBe('2026-10-19') // Monday after
    expect(reflectionWeek('2026-10-27')).toBeNull() // Tuesday
    expect(reflectionWeek('2026-10-24')).toBeNull() // Saturday
    expect(reflectionOpensOn('2026-10-22')).toBe('2026-10-25')
  })
})

describe('reminders', () => {
  test('due on the one 5-minute tick that covers the reminder time', () => {
    const at = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3))
    expect(isReminderDue('20:00', at('20:00'))).toBe(true)
    expect(isReminderDue('20:03', at('20:05'))).toBe(true)
    expect(isReminderDue('20:03', at('20:00'))).toBe(false)
    expect(isReminderDue('20:00', at('20:05'))).toBe(false)
    expect(isReminderDue('23:58', at('00:00'))).toBe(true) // across midnight
  })

  test('local minutes follow the time zone', () => {
    expect(minutesAt(new Date('2026-10-22T14:15:00Z'), 'Asia/Kathmandu')).toBe(20 * 60) // +05:45
  })

  const base = {
    doneToday: 0,
    tasks: [
      { title: 'System design', effort: 'heavy' as const },
      { title: 'Tech podcast', effort: 'light' as const },
    ],
    streak: 4,
    yesterday: 'active' as const,
    reflection: null,
  }

  test('nothing ticked: suggests the easiest task', () => {
    expect(composeReminder(base)).toMatchObject({ title: 'Day 5 is waiting', url: '/today' })
    expect(composeReminder(base)!.body).toContain('“Tech podcast”')
  })

  test('after a grace day: never miss twice, plus the reflection on Sundays', () => {
    const n = composeReminder({ ...base, yesterday: 'grace', reflection: 'open' })!
    expect(n.title).toBe('Never miss twice')
    expect(n.body).toContain('4-day streak')
    expect(n.body).toContain('reflect on your week')
  })

  test('already ticked: only reflection days say anything', () => {
    expect(composeReminder({ ...base, doneToday: 2 })).toBeNull()
    expect(composeReminder({ ...base, doneToday: 2, reflection: 'last-chance' })).toMatchObject({
      title: 'Last chance to reflect on last week',
      url: '/journal/week',
    })
  })
})
