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
