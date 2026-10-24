import type { Notification } from '../models/push'
import type { Effort } from '../models/task'
import type { DayStatus } from './streak'

// The scheduler runs every REMINDER_WINDOW_MINUTES; a reminder is due on the
// run whose window (the last N minutes, inclusive of now) contains its time.
export const REMINDER_WINDOW_MINUTES = 5

const toMinutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5))

export const isReminderDue = (reminderTime: string, nowMinutes: number, window = REMINDER_WINDOW_MINUTES) =>
  (nowMinutes - toMinutes(reminderTime) + 1440) % 1440 < window

export type ReminderState = {
  doneToday: number // completions so far today
  tasks: { title: string; effort: Effort }[] // active tasks across active goals
  streak: number
  yesterday: DayStatus | undefined
  reflection: 'open' | 'last-chance' | null // only when not yet saved
}

const EFFORT_ORDER: Record<Effort, number> = { light: 0, medium: 1, heavy: 2 }

// One gentle reminder a day, only if nothing's ticked yet; otherwise, on
// reflection days, a nudge to reflect. Returns null when there's nothing to say.
export const composeReminder = (s: ReminderState): Notification | null => {
  if (s.doneToday === 0 && s.tasks.length > 0) {
    const easiest = [...s.tasks].sort((a, b) => EFFORT_ORDER[a.effort] - EFFORT_ORDER[b.effort])[0]!
    const suggestion = `“${easiest.title}” is enough to count.`
    const then = s.reflection ? ' Then reflect on your week.' : ''
    if (s.yesterday === 'grace') {
      return {
        title: 'Never miss twice',
        body: s.streak > 0 ? `One small task keeps your ${s.streak}-day streak. ${suggestion}${then}` : `One small task gets you back on track. ${suggestion}${then}`,
        url: '/today',
        tag: 'daily',
      }
    }
    return {
      title: s.streak > 0 ? `Day ${s.streak + 1} is waiting` : 'A small step today',
      body: `Nothing ticked yet. ${suggestion}${then}`,
      url: '/today',
      tag: 'daily',
    }
  }
  if (s.reflection) {
    return {
      title: s.reflection === 'open' ? 'Your week is ready to reflect on' : 'Last chance to reflect on last week',
      body: 'Three short questions and a rating per goal. +20 XP.',
      url: '/journal/week',
      tag: 'reflection',
    }
  }
  return null
}
