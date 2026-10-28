export type User = {
  id: string
  name: string
  username: string | null
  email: string
  timezone: string
  reminderTime: string // 'HH:MM', local
  dayStartHour: number // 0–23
  analyticsEnabled: boolean // Settings → Share usage analytics
  createdAt: Date
}

export type UserPreferences = Pick<User, 'timezone' | 'reminderTime' | 'dayStartHour' | 'analyticsEnabled'>
