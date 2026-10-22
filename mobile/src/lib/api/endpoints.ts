import type {
  AddTaskRequest,
  CompletionResponse,
  CreateGoalRequest,
  GoalDetailResponse,
  GoalResponse,
  GoalStatus,
  GoalSummaryResponse,
  JournalEntryResponse,
  JournalRequest,
  JournalResponse,
  MeResponse,
  MetricResponse,
  MilestoneResponse,
  PreferencesRequest,
  ProgressResponse,
  ReflectionRequest,
  ReflectionResponse,
  SetMetricRequest,
  TaskResponse,
  TodayResponse,
  UpdateGoalRequest,
  UpdateMilestoneRequest,
  UpdateTaskRequest,
  WeekResponse,
} from 'backend/contract'
import { request } from './http'

// One typed function per API endpoint.
export const api = {
  me: {
    get: () => request<MeResponse>('GET', '/me'),
    updatePreferences: (body: PreferencesRequest) => request<MeResponse>('PATCH', '/me/preferences', body),
  },
  today: () => request<TodayResponse>('GET', '/today'),
  progress: () => request<ProgressResponse>('GET', '/progress'),
  week: {
    get: () => request<WeekResponse>('GET', '/week'),
    reflect: (body: ReflectionRequest) => request<ReflectionResponse>('PUT', '/week/reflection', body),
  },
  goals: {
    list: (statuses: GoalStatus[] = ['active']) =>
      request<GoalSummaryResponse[]>('GET', `/goals?status=${statuses.join(',')}`),
    get: (id: string) => request<GoalDetailResponse>('GET', `/goals/${id}`),
    create: (body: CreateGoalRequest) => request<GoalResponse>('POST', '/goals', body),
    update: (id: string, body: UpdateGoalRequest) => request<GoalResponse>('PATCH', `/goals/${id}`, body),
    setStatus: (id: string, status: GoalStatus) => request<GoalResponse>('POST', `/goals/${id}/status`, { status }),
    addTask: (id: string, body: AddTaskRequest) => request<TaskResponse>('POST', `/goals/${id}/tasks`, body),
    addMilestone: (id: string, title: string) =>
      request<MilestoneResponse>('POST', `/goals/${id}/milestones`, { title }),
    setMetric: (id: string, body: SetMetricRequest) => request<MetricResponse | null>('PUT', `/goals/${id}/metric`, body),
    logMetric: (id: string, value: number) => request<MetricResponse>('POST', `/goals/${id}/metric/logs`, { value }),
  },
  tasks: {
    update: (id: string, body: UpdateTaskRequest) => request<TaskResponse>('PATCH', `/tasks/${id}`, body),
    complete: (id: string) => request<CompletionResponse>('POST', `/tasks/${id}/completion`),
    undo: (id: string) => request<void>('DELETE', `/tasks/${id}/completion`),
  },
  milestones: {
    update: (id: string, body: UpdateMilestoneRequest) => request<MilestoneResponse>('PATCH', `/milestones/${id}`, body),
    remove: (id: string) => request<void>('DELETE', `/milestones/${id}`),
  },
  journal: {
    list: (limit = 30) => request<JournalResponse>('GET', `/journal?limit=${limit}`),
    write: (body: JournalRequest) => request<JournalEntryResponse>('PUT', '/journal', body),
  },
  restDays: {
    list: () => request<string[]>('GET', '/rest-days'),
    plan: (day: string) => request<{ day: string }>('PUT', `/rest-days/${day}`),
    cancel: (day: string) => request<void>('DELETE', `/rest-days/${day}`),
  },
}
