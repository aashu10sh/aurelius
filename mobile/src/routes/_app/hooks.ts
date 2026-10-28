import type { Hooks } from 'sv-router'
import { navigate } from 'sv-router/generated'
import { currentSession, forgetSession, seemsSignedIn } from '$lib/session'

// Every tabbed screen needs a signed-in user. A device that was signed in
// opens straight away and checks the session alongside; if it has ended, the
// user is sent to the welcome screen once the check says so.
export default {
  async beforeLoad() {
    if (seemsSignedIn()) {
      void currentSession().then((session) => {
        if (session || seemsSignedIn()) return
        forgetSession()
        navigate('/welcome')
      })
      return
    }
    if (!(await currentSession())) throw navigate('/welcome')
  },
} satisfies Hooks
