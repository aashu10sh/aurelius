import type { ISessionService } from '../../application/ports/ISessionService'
import type { Auth } from './betterAuth'

export class BetterAuthSessionService implements ISessionService {
  constructor(private readonly auth: Auth) {}

  async currentUserId(headers: Headers): Promise<string | null> {
    const session = await this.auth.api.getSession({ headers })
    return session?.user.id ?? null
  }
}
