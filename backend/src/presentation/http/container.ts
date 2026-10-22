import type { ISessionService } from '../../application/ports/ISessionService'
import type { CompleteTaskUseCase } from '../../application/usecases/completions/CompleteTaskUseCase'
import type { UndoCompletionUseCase } from '../../application/usecases/completions/UndoCompletionUseCase'
import type { CreateGoalUseCase } from '../../application/usecases/goals/CreateGoalUseCase'
import type { GetGoalUseCase } from '../../application/usecases/goals/GetGoalUseCase'
import type { ListGoalsUseCase } from '../../application/usecases/goals/ListGoalsUseCase'
import type { SetGoalStatusUseCase } from '../../application/usecases/goals/SetGoalStatusUseCase'
import type { UpdateGoalUseCase } from '../../application/usecases/goals/UpdateGoalUseCase'
import type { ListJournalUseCase } from '../../application/usecases/journal/ListJournalUseCase'
import type { WriteJournalEntryUseCase } from '../../application/usecases/journal/WriteJournalEntryUseCase'
import type { LogMetricUseCase } from '../../application/usecases/metrics/LogMetricUseCase'
import type { SetMetricUseCase } from '../../application/usecases/metrics/SetMetricUseCase'
import type { AddMilestoneUseCase } from '../../application/usecases/milestones/AddMilestoneUseCase'
import type { RemoveMilestoneUseCase } from '../../application/usecases/milestones/RemoveMilestoneUseCase'
import type { UpdateMilestoneUseCase } from '../../application/usecases/milestones/UpdateMilestoneUseCase'
import type { GetProgressUseCase } from '../../application/usecases/progress/GetProgressUseCase'
import type { GetWeekUseCase } from '../../application/usecases/reflections/GetWeekUseCase'
import type { SubmitReflectionUseCase } from '../../application/usecases/reflections/SubmitReflectionUseCase'
import type { CancelRestDayUseCase } from '../../application/usecases/restDays/CancelRestDayUseCase'
import type { ListRestDaysUseCase } from '../../application/usecases/restDays/ListRestDaysUseCase'
import type { PlanRestDayUseCase } from '../../application/usecases/restDays/PlanRestDayUseCase'
import type { AddTaskUseCase } from '../../application/usecases/tasks/AddTaskUseCase'
import type { UpdateTaskUseCase } from '../../application/usecases/tasks/UpdateTaskUseCase'
import type { GetTodayUseCase } from '../../application/usecases/today/GetTodayUseCase'
import type { GetMeUseCase } from '../../application/usecases/user/GetMeUseCase'
import type { UpdatePreferencesUseCase } from '../../application/usecases/user/UpdatePreferencesUseCase'

// What the HTTP layer needs. The composition root builds it; handlers only
// ever see use cases, never repositories or the auth library.
export interface AppContainer {
  session: ISessionService
  // Sign-up, sign-in and friends are served by the auth provider as-is.
  handleAuth(request: Request): Promise<Response>
  useCases: {
    getMe: GetMeUseCase
    updatePreferences: UpdatePreferencesUseCase
    getToday: GetTodayUseCase
    getProgress: GetProgressUseCase
    listGoals: ListGoalsUseCase
    getGoal: GetGoalUseCase
    createGoal: CreateGoalUseCase
    updateGoal: UpdateGoalUseCase
    setGoalStatus: SetGoalStatusUseCase
    addTask: AddTaskUseCase
    updateTask: UpdateTaskUseCase
    completeTask: CompleteTaskUseCase
    undoCompletion: UndoCompletionUseCase
    addMilestone: AddMilestoneUseCase
    updateMilestone: UpdateMilestoneUseCase
    removeMilestone: RemoveMilestoneUseCase
    setMetric: SetMetricUseCase
    logMetric: LogMetricUseCase
    listRestDays: ListRestDaysUseCase
    planRestDay: PlanRestDayUseCase
    cancelRestDay: CancelRestDayUseCase
    writeJournalEntry: WriteJournalEntryUseCase
    listJournal: ListJournalUseCase
    getWeek: GetWeekUseCase
    submitReflection: SubmitReflectionUseCase
  }
}

export type AppEnv = {
  Variables: {
    container: AppContainer
    userId: string
  }
}

// The outermost app also carries the runtime's bindings.
export type RootEnv<Bindings extends object> = { Bindings: Bindings; Variables: AppEnv['Variables'] }
