import type { Hooks } from 'sv-router'
import { navigate } from 'sv-router/generated'
import { currentSession } from '$lib/session'

// Every tabbed screen needs a signed-in user.
export default {
  async beforeLoad() {
    if (!(await currentSession())) throw navigate('/welcome')
  },
} satisfies Hooks
