import type { User } from '../../../domain/models/user'
import type { IUserRepository } from '../../../domain/repositories/IUserRepository'
import { requireUser } from '../shared'

export class GetMeUseCase {
  constructor(private readonly users: IUserRepository) {}

  execute(userId: string): Promise<User> {
    return requireUser(this.users, userId)
  }
}
