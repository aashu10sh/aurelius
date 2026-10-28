import type { Hooks } from 'sv-router'
import { navigate } from 'sv-router/generated'
import { currentSession, seemsSignedIn } from '$lib/session'

// "/" only routes: signed in → Today, otherwise the splash. Today's own guard
// confirms the session.
export default {
  async beforeLoad({ pathname }) {
    if (pathname !== '/') return
    throw navigate(seemsSignedIn() || (await currentSession()) ? '/today' : '/welcome')
  },
} satisfies Hooks
