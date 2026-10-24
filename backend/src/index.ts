import type { ReminderJob } from './application/ports/IReminderQueue'
import { makeContainer, makeJobs } from './container'
import type { Env } from './env'
import { createApp } from './presentation/http/app'

const app = createApp<Env>(makeContainer)

export default {
  fetch: app.fetch,

  // Cron (see alchemy.run.ts): queue the reminders due in this window.
  async scheduled(controller, env) {
    const queued = await makeJobs(env).scheduleReminders.execute(new Date(controller.scheduledTime))
    if (queued) console.log('reminders queued', { queued })
  },

  // Queue consumer: compose and send each reminder.
  async queue(batch, env) {
    const { sendReminder } = makeJobs(env)
    for (const message of batch.messages) {
      try {
        const outcome = await sendReminder.execute(message.body)
        if (outcome === 'retry') message.retry({ delaySeconds: 60 })
        else message.ack()
      } catch (error) {
        console.error('reminder failed', { userId: message.body.userId, error })
        message.retry({ delaySeconds: 60 })
      }
    }
  },
} satisfies ExportedHandler<Env, ReminderJob>
