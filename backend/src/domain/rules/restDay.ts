import { type Day, weekStart } from '../models/day'
import { InvalidError } from '../errors'

export const MAX_REST_DAYS_PER_WEEK = 1

// A rest day must be planned before it starts, at most one per week;
// a missed day can't be relabelled as rest afterwards.
export const assertCanPlanRestDay = (day: Day, today: Day, planned: readonly Day[]) => {
  if (day <= today) throw new InvalidError('Rest days must be planned in advance')
  const sameWeek = planned.filter((d) => d !== day && weekStart(d) === weekStart(day))
  if (sameWeek.length >= MAX_REST_DAYS_PER_WEEK) {
    throw new InvalidError(`Only ${MAX_REST_DAYS_PER_WEEK} rest day per week`)
  }
}
