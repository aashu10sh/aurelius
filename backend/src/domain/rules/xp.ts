import type { Effort } from '../models/task'

export const XP_BY_EFFORT: Record<Effort, number> = { light: 10, medium: 20, heavy: 30 }
export const MILESTONE_XP = 50
export const GOAL_XP = 200
export const REFLECTION_XP = 20

export type XpSources = {
  completionXp: number
  milestonesDone: number
  goalsCompleted: number
  reflections: number
}

// XP is derived from stored facts, never kept as a separate running total.
export const totalXp = (s: XpSources) =>
  s.completionXp + s.milestonesDone * MILESTONE_XP + s.goalsCompleted * GOAL_XP + s.reflections * REFLECTION_XP

// Level L is reached at 50 × L × (L + 1) XP: 100, 300, 600, … 5,500 at level 10.
export const xpForLevel = (level: number) => 50 * level * (level + 1)

export type LevelProgress = {
  level: number
  xp: number
  levelStartXp: number
  nextLevelXp: number
}

export const levelFor = (xp: number): LevelProgress => {
  let level = 0
  while (xpForLevel(level + 1) <= xp) level++
  return { level, xp, levelStartXp: xpForLevel(level), nextLevelXp: xpForLevel(level + 1) }
}
