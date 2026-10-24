import { createMutation, createQuery, QueryClient, useQueryClient } from '@tanstack/svelte-query'
import type { CompletionResponse, GoalStatus, TodayResponse } from 'backend/contract'
import { toast } from 'svelte-sonner'
import { authClient } from '../auth'
import { api } from './endpoints'
import { ApiError } from './http'

// Screens read and write data only through this module.

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
    },
  },
})

export const keys = {
  me: ['me'] as const,
  today: ['today'] as const,
  progress: ['progress'] as const,
  week: ['week'] as const,
  goals: (statuses: GoalStatus[]) => ['goals', statuses.join(',')] as const,
  goal: (id: string) => ['goal', id] as const,
  journal: ['journal'] as const,
  restDays: ['rest-days'] as const,
  accounts: ['accounts'] as const,
}

export const meQuery = () => createQuery(() => ({ queryKey: keys.me, queryFn: api.me.get }))
export const todayQuery = () => createQuery(() => ({ queryKey: keys.today, queryFn: api.today }))
export const progressQuery = () => createQuery(() => ({ queryKey: keys.progress, queryFn: api.progress }))
export const weekQuery = () => createQuery(() => ({ queryKey: keys.week, queryFn: api.week.get }))
export const journalQuery = () => createQuery(() => ({ queryKey: keys.journal, queryFn: () => api.journal.list() }))
export const restDaysQuery = () => createQuery(() => ({ queryKey: keys.restDays, queryFn: api.restDays.list }))

// Sign-in methods ('credential' = username and password, 'google'), straight from Better Auth.
export const accountsQuery = () =>
  createQuery(() => ({
    queryKey: keys.accounts,
    queryFn: async () => {
      const { data, error } = await authClient.listAccounts()
      if (error) throw new Error(error.message ?? 'Could not load sign-in methods')
      return data.map(({ id, providerId }) => ({ id, providerId }))
    },
  }))

export const goalsQuery = (statuses: () => GoalStatus[]) =>
  createQuery(() => ({ queryKey: keys.goals(statuses()), queryFn: () => api.goals.list(statuses()) }))

export const goalQuery = (id: () => string) =>
  createQuery(() => ({ queryKey: keys.goal(id()), queryFn: () => api.goals.get(id()) }))

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Something went wrong')

// Every write can move XP, consistency or the streak, so refresh all reads.
// `quiet` skips the error toast for forms that show errors inline.
export const useAction = <Args, Result>(fn: (args: Args) => Promise<Result>, options: { quiet?: boolean } = {}) => {
  const client = useQueryClient()
  return createMutation(() => ({
    mutationFn: fn,
    onSuccess: () => client.invalidateQueries(),
    onError: (error) => {
      if (!options.quiet) toast.error(errorMessage(error))
    },
  }))
}

// Ticking a task updates Today immediately, then reconciles with the server.
export const useToggleTask = () => {
  const client = useQueryClient()
  type Vars = { taskId: string; done: boolean }
  // Resolves to the completion when ticking (it carries `levelUp`), null when unticking.
  return createMutation<CompletionResponse | null, Error, Vars, { previous?: TodayResponse }>(() => ({
    mutationFn: async ({ taskId, done }) => {
      if (done) return api.tasks.complete(taskId)
      await api.tasks.undo(taskId)
      return null
    },
    onMutate: async ({ taskId, done }) => {
      await client.cancelQueries({ queryKey: keys.today })
      const previous = client.getQueryData<TodayResponse>(keys.today)
      if (previous) client.setQueryData(keys.today, withTaskToggled(previous, taskId, done))
      return { previous }
    },
    onError: (error, _vars, context) => {
      if (context?.previous) client.setQueryData(keys.today, context.previous)
      toast.error(errorMessage(error))
    },
    onSettled: () => client.invalidateQueries(),
  }))
}

const withTaskToggled = (today: TodayResponse, taskId: string, done: boolean): TodayResponse => {
  let xpDelta = 0
  const goals = today.goals.map((goal) => ({
    ...goal,
    tasks: goal.tasks.map((task) => {
      if (task.id !== taskId || task.doneToday === done) return task
      xpDelta += done ? task.xp : -task.xp
      return { ...task, doneToday: done, periodDone: task.periodDone + (done ? 1 : -1) }
    }),
  }))
  // The first tick of the day makes it active and extends the streak; undoing
  // the last one reverts that. The refetch afterwards has the final word.
  const activeNow = goals.some((g) => g.tasks.some((t) => t.doneToday))
  const wasActive = today.streak.today === 'active'
  const streak =
    activeNow === wasActive
      ? today.streak
      : activeNow
        ? { ...today.streak, today: 'active' as const, current: today.streak.current + 1, longest: Math.max(today.streak.longest, today.streak.current + 1) }
        : { ...today.streak, today: 'pending' as const, current: Math.max(0, today.streak.current - 1) }
  return { ...today, goals, streak, xpToday: today.xpToday + xpDelta }
}
