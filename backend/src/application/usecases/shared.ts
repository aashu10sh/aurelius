import { NotFoundError } from '../../domain/errors'
import type { Goal } from '../../domain/models/goal'
import type { Task } from '../../domain/models/task'
import type { User } from '../../domain/models/user'
import type { IGoalRepository } from '../../domain/repositories/IGoalRepository'
import type { ITaskRepository } from '../../domain/repositories/ITaskRepository'
import type { IUserRepository } from '../../domain/repositories/IUserRepository'

// Ownership checks: another user's goal reads as "not found", never "forbidden".

export const requireUser = async (users: IUserRepository, userId: string): Promise<User> => {
  const user = await users.findById(userId)
  if (!user) throw new NotFoundError('User')
  return user
}

export const requireGoal = async (goals: IGoalRepository, userId: string, goalId: string): Promise<Goal> => {
  const goal = await goals.findById(goalId)
  if (!goal || goal.userId !== userId) throw new NotFoundError('Goal')
  return goal
}

export const requireTask = async (
  tasks: ITaskRepository,
  goals: IGoalRepository,
  userId: string,
  taskId: string,
): Promise<{ task: Task; goal: Goal }> => {
  const task = await tasks.findById(taskId)
  if (!task) throw new NotFoundError('Task')
  const goal = await goals.findById(task.goalId)
  if (!goal || goal.userId !== userId) throw new NotFoundError('Task')
  return { task, goal }
}
