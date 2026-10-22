export type User = {
  id: string
  name: string
  username: string | null
  email: string
  timezone: string
  reminderTime: string // 'HH:MM', local
  dayStartHour: number // 0–23
  createdAt: Date
}

export type UserPreferences = Pick<User, 'timezone' | 'reminderTime' | 'dayStartHour'>
