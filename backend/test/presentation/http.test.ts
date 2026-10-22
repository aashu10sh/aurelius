import { beforeEach, describe, expect, test } from 'bun:test'
import { createApp } from '../../src/presentation/http/app'
import { makeFakeContainer } from '../container'

const hari = {
  id: 'hari',
  name: 'Hari',
  username: 'hari',
  email: 'hari@example.com',
  timezone: 'UTC',
  reminderTime: '20:00',
  dayStartHour: 3,
  createdAt: new Date('2026-10-01T09:00:00Z'),
}

let app: ReturnType<typeof createApp<object>>
beforeEach(() => {
  // One container for the whole test, so state survives across requests.
  const container = makeFakeContainer([hari], new Date('2026-10-22T14:00:00Z'))
  app = createApp<object>(() => container)
})

const call = (method: string, path: string, body?: unknown, user: string | null = 'hari') =>
  app.request(`/api${path}`, {
    method,
    headers: {
      ...(user ? { authorization: `Bearer ${user}` } : {}),
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

describe('HTTP API', () => {
  test('health and auth are public; everything else needs a session', async () => {
    expect((await call('GET', '/health', undefined, null)).status).toBe(200)
    expect((await call('POST', '/auth/sign-in/email', {}, null)).status).toBe(200)
    expect((await call('GET', '/today', undefined, null)).status).toBe(401)
  })

  test('onboarding flow: create a goal, tick a task, see it on Today', async () => {
    const created = await call('POST', '/goals', {
      title: 'Get fit',
      tasks: [{ title: 'Gym', effort: 'medium', cadence: { type: 'weekly', count: 3 } }],
      metric: { unit: 'kg', startValue: 82, targetValue: 77 },
    })
    expect(created.status).toBe(201)
    const goal = (await created.json()) as { id: string }

    const detail = (await (await call('GET', `/goals/${goal.id}`)).json()) as { tasks: { id: string }[] }
    const taskId = detail.tasks[0]!.id

    expect((await call('POST', `/tasks/${taskId}/completion`)).status).toBe(201)
    expect((await call('POST', `/tasks/${taskId}/completion`)).status).toBe(409)

    const today = (await (await call('GET', '/today')).json()) as { xpToday: number; goals: unknown[] }
    expect(today.xpToday).toBe(20)
    expect(today.goals).toHaveLength(1)

    expect((await call('DELETE', `/tasks/${taskId}/completion`)).status).toBe(204)
  })

  test('malformed requests are 400 with issues; rule breaks are 422', async () => {
    const bad = await call('POST', '/goals', { title: '' })
    expect(bad.status).toBe(400)
    const body = (await bad.json()) as { error: { code: string; issues: unknown[] } }
    expect(body.error.code).toBe('bad_request')
    expect(body.error.issues.length).toBeGreaterThan(0)

    const tooOften = await call('POST', '/goals', {
      title: 'Read',
      tasks: [{ title: 'Read', effort: 'light', cadence: { type: 'weekly', count: 9 } }],
    })
    expect(tooOften.status).toBe(422)
  })

  test('unknown ids are 404', async () => {
    expect((await call('GET', '/goals/nope')).status).toBe(404)
  })
})
