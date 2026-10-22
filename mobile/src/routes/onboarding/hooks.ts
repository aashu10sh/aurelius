import type { Hooks } from 'sv-router'
import { navigate } from 'sv-router/generated'
import { currentSession } from '$lib/session'

export default {
  async beforeLoad() {
    if (!(await currentSession())) throw navigate('/welcome')
  },
} satisfies Hooks
