import type { Cadence, Effort } from 'backend/contract'

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

// Days are 'YYYY-MM-DD' calendar dates; parse as UTC so no timezone shifts them.
const parse = (day: string) => new Date(`${day}T00:00:00Z`)

// 'THU · 22 OCT'
export const dayLabel = (day: string) => {
  const d = parse(day)
  return `${WEEKDAYS[d.getUTCDay()]} · ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

// '22 APR 2027'
export const dateLabel = (day: string) => {
  const d = parse(day)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

// '19–25 OCT' for a week starting on `start`.
export const weekLabel = (start: string) => {
  const from = parse(start)
  const to = new Date(from.getTime() + 6 * 86_400_000)
  const sameMonth = from.getUTCMonth() === to.getUTCMonth()
  return sameMonth
    ? `${from.getUTCDate()}–${to.getUTCDate()} ${MONTHS[to.getUTCMonth()]}`
    : `${from.getUTCDate()} ${MONTHS[from.getUTCMonth()]} – ${to.getUTCDate()} ${MONTHS[to.getUTCMonth()]}`
}

export const monthShort = (day: string) => MONTHS[parse(day).getUTCMonth()]!

export const greeting = (hour = new Date().getHours()) =>
  hour < 5 ? 'Still up' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

export const number = (n: number) => n.toLocaleString('en-US')

export const percent = (score: number | null) => (score === null ? '—' : String(Math.round(score * 100)))

export const effortLabel: Record<Effort, string> = { light: 'LIGHT', medium: 'MED', heavy: 'HEAVY' }

// '3×/wk', 'daily', '2×/mo'
export const cadenceShort = (c: Cadence) =>
  c.type === 'daily' ? 'daily' : `${c.count}×/${c.type === 'weekly' ? 'wk' : 'mo'}`

// '2/3 this week'
export const cadenceProgress = (c: Cadence, done: number) =>
  `${done}/${c.count} ${c.type === 'daily' ? 'today' : c.type === 'weekly' ? 'this week' : 'this month'}`

export const initial = (name: string) => name.trim().charAt(0).toUpperCase() || 'A'

// ISO week number of a Monday-start week.
export const isoWeek = (day: string) => {
  const d = parse(day)
  d.setUTCDate(d.getUTCDate() + 3 - ((d.getUTCDay() + 6) % 7)) // Thursday of this week
  const jan4 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4))
  return 1 + Math.round(((d.getTime() - jan4.getTime()) / 86_400_000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7)
}
