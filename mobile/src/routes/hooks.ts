import type { Hooks } from 'sv-router'
import { navigate } from 'sv-router/generated'
import { currentSession } from '$lib/session'

// "/" only routes: signed in → Today, otherwise the splash.
export default {
  async beforeLoad({ pathname }) {
    if (pathname !== '/') return
    throw navigate((await currentSession()) ? '/today' : '/welcome')
  },
} satisfies Hooks
