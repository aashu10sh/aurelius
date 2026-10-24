import type { IReminderQueue, ReminderJob } from '../../application/ports/IReminderQueue'

// Cloudflare Queues accepts at most 100 messages per sendBatch call.
const BATCH = 100

export class CloudflareReminderQueue implements IReminderQueue {
  constructor(private readonly queue: Queue<ReminderJob>) {}

  async enqueue(jobs: readonly ReminderJob[]): Promise<void> {
    for (let i = 0; i < jobs.length; i += BATCH) {
      await this.queue.sendBatch(jobs.slice(i, i + BATCH).map((body) => ({ body })))
    }
  }
}
