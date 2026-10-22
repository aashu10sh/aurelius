// Resolves the signed-in user from request headers. Implemented over Better
// Auth in infrastructure; nothing inside the application knows which.
export interface ISessionService {
  currentUserId(headers: Headers): Promise<string | null>
}
