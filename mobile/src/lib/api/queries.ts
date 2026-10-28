import { createMutation, createQuery, keepPreviousData, QueryClient, useQueryClient } from '@tanstack/svelte-query'
import type { CompletionResponse, GoalDetailResponse, GoalResponse, GoalStatus, TodayResponse } from 'backend/contract'
import { toast } from 'svelte-sonner'
import { authClient } from '../auth'
import { tabShown } from '../tabs'
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

// Shared by the screens' queries and the prefetch below, so both hit the same cache entry.
const options = {
  today: () => ({ queryKey: keys.today, queryFn: api.today }),
  progress: () => ({ queryKey: keys.progress, queryFn: api.progress }),
  week: () => ({ queryKey: keys.week, queryFn: api.week.get }),
  journal: () => ({ queryKey: keys.journal, queryFn: () => api.journal.list() }),
  goals: (statuses: GoalStatus[]) => ({ queryKey: keys.goals(statuses), queryFn: () => api.goals.list(statuses) }),
  goal: (id: string) => ({ queryKey: keys.goal(id), queryFn: () => api.goals.get(id) }),
}

// A hidden tab keeps showing its cached data but doesn't refetch; once shown
// again it refetches whatever went stale (e.g. after a write) in the background.
const whileShown = <T extends object>(make: () => T) => {
  const shown = tabShown()
  return () => ({ ...make(), enabled: shown() })
}

export const meQuery = () => createQuery(() => ({ queryKey: keys.me, queryFn: api.me.get }))
export const todayQuery = () => createQuery(whileShown(options.today))
export const progressQuery = () => createQuery(whileShown(options.progress))
export const weekQuery = () => createQuery(whileShown(options.week))
export const journalQuery = () => createQuery(whileShown(options.journal))
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

// Switching the filter keeps the old list up until the new one arrives, instead of a skeleton.
export const goalsQuery = (statuses: () => GoalStatus[]) =>
  createQuery(whileShown(() => ({ ...options.goals(statuses()), placeholderData: keepPreviousData })))

export const goalQuery = (id: () => string) => createQuery(() => options.goal(id()))

// Every tab's data, fetched once signed in, so no tab opens on a skeleton.
// Fresh entries (within staleTime) are left alone.
export const prefetchTabs = () =>
  Promise.all([
    queryClient.prefetchQuery(options.today()),
    queryClient.prefetchQuery(options.goals(['active'])),
    queryClient.prefetchQuery(options.progress()),
    queryClient.prefetchQuery(options.week()),
    queryClient.prefetchQuery(options.journal()),
  ])

// Started on touch-down of a goal link, so the detail is usually ready by the tap.
export const prefetchGoal = (id: string) => queryClient.prefetchQuery(options.goal(id))

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : 'Something went wrong')

// Every write can move XP, consistency or the streak, so refresh all reads
// (only those on screen refetch now; hidden tabs catch up when shown).
// The refetch isn't awaited, so the action stops pending as soon as the
// write lands instead of after every read on screen has reloaded.
// `quiet` skips the error toast for forms that show errors inline.
export const useAction = <Args, Result>(fn: (args: Args) => Promise<Result>, options: { quiet?: boolean } = {}) => {
  const client = useQueryClient()
  return createMutation(() => ({
    mutationFn: fn,
    onSuccess: () => {
      void client.invalidateQueries()
    },
    onError: (error) => {
      if (!options.quiet) toast.error(errorMessage(error))
    },
  }))
}

// Completing, archiving or reopening shows on the goal's screen immediately,
// then reconciles with the server.
export const useSetGoalStatus = (id: () => string) => {
  const client = useQueryClient()
  return createMutation<GoalResponse, Error, GoalStatus, { previous?: GoalDetailResponse }>(() => ({
    mutationFn: (status) => api.goals.setStatus(id(), status),
    onMutate: async (status) => {
      const key = keys.goal(id())
      await client.cancelQueries({ queryKey: key })
      const previous = client.getQueryData<GoalDetailResponse>(key)
      if (previous) client.setQueryData(key, { ...previous, status })
      return { previous }
    },
    onError: (error, _status, context) => {
      if (context?.previous) client.setQueryData(keys.goal(id()), context.previous)
      toast.error(errorMessage(error))
    },
    onSettled: () => {
      void client.invalidateQueries()
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
    // Not awaited, so the caller's onSuccess (the level-up celebration) runs
    // as soon as the server answers, not after Today has reloaded.
    onSettled: () => {
      void client.invalidateQueries()
    },
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
