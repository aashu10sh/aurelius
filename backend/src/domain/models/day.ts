// A user's local calendar day as 'YYYY-MM-DD'. Days roll over at the user's
// day_start_hour (default 3am), so late-night work counts for the evening before.
export type Day = string

const DAY_MS = 86_400_000

const toUtc = (day: Day) => Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10))
const fromUtc = (ms: number): Day => new Date(ms).toISOString().slice(0, 10)

export const isDay = (value: string): value is Day =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && fromUtc(toUtc(value)) === value

export const addDays = (day: Day, n: number): Day => fromUtc(toUtc(day) + n * DAY_MS)

// Whole days from `from` to `to` (positive when `to` is later).
export const daysBetween = (from: Day, to: Day) => Math.round((toUtc(to) - toUtc(from)) / DAY_MS)

// Inclusive range, oldest first.
export const dayRange = (from: Day, to: Day): Day[] => {
  const days: Day[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d)
  return days
}

// Weeks start on Monday.
export const weekStart = (day: Day): Day => {
  const weekday = (new Date(toUtc(day)).getUTCDay() + 6) % 7
  return addDays(day, -weekday)
}

export const monthStart = (day: Day): Day => `${day.slice(0, 7)}-01`

export const minDay = (a: Day, b: Day): Day => (a < b ? a : b)
export const maxDay = (a: Day, b: Day): Day => (a > b ? a : b)

// The local day an instant falls on for a user.
export const dayAt = (instant: Date, timeZone: string, dayStartHour: number): Day => {
  const shifted = new Date(instant.getTime() - dayStartHour * 3_600_000)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(shifted)
  const get = (type: string) => parts.find((p) => p.type === type)!.value
  return `${get('year')}-${get('month')}-${get('day')}`
}
