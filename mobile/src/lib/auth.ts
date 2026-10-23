import { inferAdditionalFields, usernameClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/svelte'

// Same-origin: the app's worker forwards /api/* to the API.
export const authClient = createAuthClient({
  basePath: '/api/auth',
  plugins: [
    usernameClient(),
    // Mirrors user.additionalFields in backend/src/auth.ts.
    inferAdditionalFields({
      user: {
        timezone: { type: 'string', required: false },
        reminderTime: { type: 'string', required: false },
        dayStartHour: { type: 'number', required: false },
      },
    }),
  ],
})

// Google sign-in failures come back as /sign-in?error=<code>.
const oauthErrors: Record<string, string> = {
  account_not_linked:
    'That email already has an Aurelius account. Sign in with your username and password, then connect Google in Settings.',
  account_already_linked_to_different_user: 'That Google account is already connected to another Aurelius account.',
  access_denied: 'Google sign-in was cancelled.',
}

export const authErrorMessage = (code: string) => oauthErrors[code] ?? 'Google sign-in didn’t work. Please try again.'
